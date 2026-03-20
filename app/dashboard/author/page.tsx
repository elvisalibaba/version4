import Link from "next/link";
import { BookOpen, CircleDollarSign, Library, PlusCircle, Sparkles, TrendingUp, Users } from "lucide-react";
import { DashboardTopbar } from "@/components/ui/dashboard-topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { getLibraryAccessLabel } from "@/lib/access-labels";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { BookReviewStatus, Database } from "@/types/database";

type AuthorBookLite = Pick<Database["public"]["Tables"]["books"]["Row"], "id" | "title" | "status" | "created_at" | "price" | "author_id" | "review_status">;
type OrderItemWithRelations = {
  price: number;
  books: { author_id: string }[] | { author_id: string } | null;
  orders: { payment_status: string }[] | { payment_status: string } | null;
};
type AcquisitionRow = {
  user_id: string;
  purchased_at: string;
  access_type: Database["public"]["Tables"]["library"]["Row"]["access_type"];
  subscription_id: string | null;
  books: { id: string; title: string; price: number; author_id: string }[] | { id: string; title: string; price: number; author_id: string } | null;
  profiles: { name: string | null; email: string }[] | { name: string | null; email: string } | null;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function AuthorDashboardPage() {
  const profile = await requireRole(["author"]);
  const supabase = await createClient();

  const [{ data: books }, { data: orderItems }, { data: acquisitions }] = await Promise.all([
    supabase
      .from("books")
      .select("id, title, status, created_at, price, review_status")
      .eq("author_id", profile.id)
      .order("created_at", { ascending: false })
      .returns<AuthorBookLite[]>(),
    supabase
      .from("order_items")
      .select("price, books:book_id(author_id), orders:order_id(payment_status)")
      .order("id", { ascending: false })
      .returns<OrderItemWithRelations[]>(),
    supabase
      .from("library")
      .select("user_id, purchased_at, access_type, subscription_id, books:book_id(id, title, price, author_id), profiles:user_id(name, email)")
      .order("purchased_at", { ascending: false })
      .returns<AcquisitionRow[]>(),
  ]);

  const ownPaidSales =
    orderItems?.filter((item) => {
      const book = Array.isArray(item.books) ? item.books[0] : item.books;
      const order = Array.isArray(item.orders) ? item.orders[0] : item.orders;
      return book?.author_id === profile.id && order?.payment_status === "paid";
    }) ?? [];

  const ownAcquisitions =
    acquisitions?.filter((item) => {
      const book = Array.isArray(item.books) ? item.books[0] : item.books;
      return book?.author_id === profile.id;
    }) ?? [];

  const totalBooks = books?.length ?? 0;
  const publishedBooks = books?.filter((book) => book.status === "published").length ?? 0;
  const draftBooks = books?.filter((book) => book.status === "draft").length ?? 0;
  const submittedBooks = books?.filter((book) => book.review_status === "submitted").length ?? 0;
  const totalRevenue = ownPaidSales.reduce((sum, item) => sum + item.price, 0);
  const recentBooks = books?.slice(0, 4) ?? [];
  const uniqueReaders = new Set(ownAcquisitions.map((item) => item.user_id)).size;
  const freeClaims = ownAcquisitions.filter((item) => item.access_type === "free").length;
  const subscriptionClaims = ownAcquisitions.filter((item) => item.access_type === "subscription").length;
  const recentReaders = ownAcquisitions.slice(0, 6);
  const statusMeta = {
    published: { label: "Publie", className: "bg-[#edf7f0] text-[#2f6f4f]" },
    draft: { label: "Brouillon", className: "bg-[#fff3e2] text-[#a06a2b]" },
    coming_soon: { label: "Bientot disponible", className: "bg-[#edf6fb] text-[#3d6f83]" },
    archived: { label: "Archive", className: "bg-[#f3f1ee] text-[#5c544b]" },
  } as const;
  const reviewMeta: Record<BookReviewStatus, { label: string; className: string }> = {
    draft: { label: "Brouillon", className: "bg-[#f3f1ee] text-[#5c544b]" },
    submitted: { label: "Soumis", className: "bg-[#fff3e2] text-[#a06a2b]" },
    approved: { label: "Valide", className: "bg-[#edf7f0] text-[#2f6f4f]" },
    rejected: { label: "Refuse", className: "bg-[#fff0eb] text-[#b45b48]" },
    changes_requested: { label: "Corrections", className: "bg-[#f4efff] text-[#5b49df]" },
  };

  return (
    <section className="space-y-6">
      <DashboardTopbar
        kicker="Author studio"
        title={`Studio auteur de ${profile.name ?? profile.email}`}
        description="Suivez votre catalogue, vos lecteurs et vos ventes dans une interface plus sobre, avec des priorites plus lisibles."
        actions={
          <>
            <Link
              href="/dashboard/author/add-book"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[#171717] px-4 text-sm font-semibold text-white transition hover:bg-[#0f172a]"
            >
              <PlusCircle className="h-4 w-4" />
              Ajouter un livre
            </Link>
            <Link
              href="/dashboard/author/books"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-[#e7ddd1] bg-white px-4 text-sm font-semibold text-[#26221d] transition hover:border-[#d5c8bb]"
            >
              <Library className="h-4 w-4" />
              Voir le catalogue
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={BookOpen} label="Livres" value={totalBooks} description="Dans votre catalogue" tone="violet" />
        <StatCard icon={TrendingUp} label="Publies" value={publishedBooks} description="Disponibles en vente" tone="emerald" />
        <StatCard icon={Sparkles} label="Brouillons" value={draftBooks} description="A finaliser" tone="amber" />
        <StatCard icon={Users} label="Soumis" value={submittedBooks} description="En revue admin" tone="sky" />
        <StatCard icon={CircleDollarSign} label="Revenus" value={formatCurrency(totalRevenue)} description="Commandes payees" tone="rose" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <section className="rounded-[30px] border border-[#e7ddd1] bg-white/95 p-5 shadow-[0_22px_50px_rgba(15,23,42,0.05)] sm:p-6">
          <div className="flex flex-col gap-3 border-b border-[#f1e8de] pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#a85b3f]">Readers</p>
              <h2 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-[#171717]">Acquisitions recentes</h2>
              <p className="text-sm leading-7 text-[#6f665e]">Les derniers lecteurs visibles sur vos titres, tous acces confondus.</p>
            </div>
            <Link
              href="/dashboard/author/sales"
              className="inline-flex h-11 items-center justify-center rounded-full border border-[#e7ddd1] bg-[#fcfaf7] px-4 text-sm font-semibold text-[#26221d] transition hover:border-[#d5c8bb] hover:bg-white"
            >
              Voir les ventes
            </Link>
          </div>

          <div className="mt-5 grid gap-3">
            {recentReaders.length > 0 ? (
              recentReaders.map((entry, index) => {
                const book = Array.isArray(entry.books) ? entry.books[0] : entry.books;
                const buyer = Array.isArray(entry.profiles) ? entry.profiles[0] : entry.profiles;

                return (
                  <article
                    key={`${entry.user_id}-${entry.purchased_at}-${index}`}
                    className="flex flex-col gap-4 rounded-[24px] border border-[#ece3d7] bg-[#fcfaf7] p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#fff1ea] px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-[#a85b3f]">
                          Lecteur {index + 1}
                        </span>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-[#6f665e]">
                          {getLibraryAccessLabel(entry.access_type)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#171717]">{buyer?.name ?? "Lecteur"}</p>
                        <p className="text-sm text-[#6f665e]">{buyer?.email ?? "email indisponible"}</p>
                      </div>
                      <p className="text-sm leading-6 text-[#4f4740]">
                        <span className="font-medium text-[#171717]">{book?.title ?? "Livre supprime"}</span> • ajoute le {formatShortDate(entry.purchased_at)}
                      </p>
                    </div>
                    <div className="rounded-[18px] border border-[#ece3d7] bg-white px-4 py-3 text-right">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#8b8177]">Canal</p>
                      <p className="mt-1 text-sm font-semibold text-[#171717]">{getLibraryAccessLabel(entry.access_type)}</p>
                    </div>
                  </article>
                );
              })
            ) : (
              <EmptyState title="Aucun lecteur visible" description="Vos prochaines acquisitions lecteur apparaitront ici." />
            )}
          </div>
        </section>

        <div className="grid gap-4">
          <section className="rounded-[30px] border border-[#e7ddd1] bg-white/95 p-5 shadow-[0_22px_50px_rgba(15,23,42,0.05)]">
            <div className="space-y-2">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#a85b3f]">Audience</p>
              <h2 className="text-[1.3rem] font-semibold tracking-[-0.04em] text-[#171717]">Lecture de votre catalogue</h2>
            </div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-[22px] border border-[#ece3d7] bg-[#fcfaf7] p-4">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#8b8177]">Lecteurs uniques</p>
                <p className="mt-2 text-[1.7rem] font-semibold tracking-[-0.04em] text-[#171717]">{uniqueReaders}</p>
              </div>
              <div className="rounded-[22px] border border-[#ece3d7] bg-[#fcfaf7] p-4">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#8b8177]">Lectures gratuites</p>
                <p className="mt-2 text-[1.7rem] font-semibold tracking-[-0.04em] text-[#171717]">{freeClaims}</p>
              </div>
              <div className="rounded-[22px] border border-[#ece3d7] bg-[#fcfaf7] p-4">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#8b8177]">Lectures Premium</p>
                <p className="mt-2 text-[1.7rem] font-semibold tracking-[-0.04em] text-[#171717]">{subscriptionClaims}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[30px] border border-[#e7ddd1] bg-white/95 p-5 shadow-[0_22px_50px_rgba(15,23,42,0.05)]">
            <div className="space-y-2">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#a85b3f]">Pipeline</p>
              <h2 className="text-[1.3rem] font-semibold tracking-[-0.04em] text-[#171717]">Etat du catalogue</h2>
            </div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-[22px] border border-[#ece3d7] bg-[#fcfaf7] p-4">
                <p className="text-sm font-semibold text-[#171717]">Livres publies</p>
                <p className="mt-1 text-sm text-[#6f665e]">{publishedBooks} titre(s) deja disponibles en vente.</p>
              </div>
              <div className="rounded-[22px] border border-[#ece3d7] bg-[#fcfaf7] p-4">
                <p className="text-sm font-semibold text-[#171717]">Brouillons en attente</p>
                <p className="mt-1 text-sm text-[#6f665e]">{draftBooks} titre(s) a finaliser avant soumission.</p>
              </div>
              <div className="rounded-[22px] border border-[#ece3d7] bg-[#fcfaf7] p-4">
                <p className="text-sm font-semibold text-[#171717]">En revue admin</p>
                <p className="mt-1 text-sm text-[#6f665e]">{submittedBooks} titre(s) en cours de validation.</p>
              </div>
            </div>
          </section>

          <section className="rounded-[30px] border border-[#171717] bg-[#171717] p-5 text-white shadow-[0_26px_60px_rgba(15,23,42,0.18)]">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#ffd9cd]">Revenu cumule</p>
            <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.05em] text-white">{formatCurrency(totalRevenue)}</h2>
            <p className="mt-2 text-sm leading-7 text-white/72">
              Montant observe sur les commandes payees rattachees a vos livres. Les lectures gratuites et Premium restent suivies a part.
            </p>
          </section>

          <section className="rounded-[30px] border border-[#e7ddd1] bg-white/95 p-5 shadow-[0_22px_50px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-2">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#a85b3f]">Catalogue</p>
                <h2 className="text-[1.3rem] font-semibold tracking-[-0.04em] text-[#171717]">Derniers livres</h2>
              </div>
              <Link href="/dashboard/author/books" className="text-sm font-semibold text-[#171717] transition hover:text-[#ff6a4c]">
                Tout voir
              </Link>
            </div>

            <div className="mt-4 grid gap-3">
              {recentBooks.length > 0 ? (
                recentBooks.map((book) => (
                  <article key={book.id} className="rounded-[22px] border border-[#ece3d7] bg-[#fcfaf7] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#171717]">{book.title}</p>
                        <p className="mt-1 text-sm text-[#6f665e]">Cree le {formatShortDate(book.created_at)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.15em] ${statusMeta[book.status]?.className ?? statusMeta.draft.className}`}>
                          {statusMeta[book.status]?.label ?? statusMeta.draft.label}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.15em] ${
                            reviewMeta[book.review_status]?.className ?? reviewMeta.draft.className
                          }`}
                        >
                          {reviewMeta[book.review_status]?.label ?? reviewMeta.draft.label}
                        </span>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <EmptyState
                  title="Aucun livre ajoute"
                  description="Ajoutez votre premier titre pour commencer a alimenter votre studio auteur."
                  action={
                    <Link
                      href="/dashboard/author/add-book"
                      className="inline-flex h-11 items-center justify-center rounded-full bg-[#171717] px-4 text-sm font-semibold text-white transition hover:bg-[#0f172a]"
                    >
                      Ajouter un livre
                    </Link>
                  }
                />
              )}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
