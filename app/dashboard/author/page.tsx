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
  const recentReaders = ownAcquisitions.slice(0, 5);
  const statusMeta = {
    published: { label: "Publie", className: "bg-emerald-100 text-emerald-700" },
    draft: { label: "Brouillon", className: "bg-[#faf1e1] text-[#a06a2b]" },
    coming_soon: { label: "Bientot disponible", className: "bg-[#edf4f7] text-[#3d6f83]" },
    archived: { label: "Archive", className: "bg-[#f2f0ec] text-[#5c544b]" },
  } as const;
  const reviewMeta: Record<BookReviewStatus, { label: string; className: string }> = {
    draft: { label: "Brouillon", className: "bg-[#f2f0ec] text-[#5c544b]" },
    submitted: { label: "Soumis", className: "bg-[#faf1e1] text-[#a06a2b]" },
    approved: { label: "Valide", className: "bg-emerald-100 text-emerald-700" },
    rejected: { label: "Refuse", className: "bg-[#fde9e3] text-[#b45b48]" },
    changes_requested: { label: "Corrections", className: "bg-[#f8efe7] text-[#a85b3f]" },
  };

  return (
    <section className="space-y-6">
      <DashboardTopbar
        kicker="Writer side"
        title={`Tableau de bord auteur de ${profile.name ?? profile.email}`}
        description="Suivez vos performances, votre audience et toutes les acquisitions de votre catalogue dans une interface plus editoriale et plus professionnelle."
        actions={
          <>
            <Link href="/dashboard/author/add-book" className="cta-primary px-5 py-3 text-sm">
              <PlusCircle className="h-4 w-4" />
              Ajouter un livre
            </Link>
            <Link href="/dashboard/author/books" className="cta-secondary px-5 py-3 text-sm">
              <Library className="h-4 w-4" />
              Voir le catalogue
            </Link>
          </>
        }
      />

      <div className="metric-grid">
        <StatCard icon={BookOpen} label="Livres" value={totalBooks} description="Dans votre catalogue" tone="violet" />
        <StatCard icon={TrendingUp} label="Publies" value={publishedBooks} description="Disponibles en vente" tone="emerald" />
        <StatCard icon={Sparkles} label="Brouillons" value={draftBooks} description="A finaliser" tone="amber" />
        <StatCard icon={Users} label="Soumis" value={submittedBooks} description="En revue admin" tone="sky" />
        <StatCard icon={CircleDollarSign} label="Revenus" value={`$${totalRevenue.toFixed(2)}`} description="Commandes payees" tone="rose" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="surface-panel p-6">
          <div className="section-header">
            <div className="space-y-2">
              <p className="section-kicker">Readers</p>
              <h2 className="section-title text-2xl">Derniers lecteurs</h2>
              <p className="section-description">Les acquisitions les plus recentes de vos titres, tous acces confondus.</p>
            </div>
            <Link href="/dashboard/author/sales" className="cta-secondary px-4 py-2 text-sm">
              Voir toutes les ventes
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {recentReaders.length > 0 ? (
              recentReaders.map((entry, index) => {
                const book = Array.isArray(entry.books) ? entry.books[0] : entry.books;
                const buyer = Array.isArray(entry.profiles) ? entry.profiles[0] : entry.profiles;
                const isSubscription = entry.access_type === "subscription";
                const isFree = entry.access_type === "free";

                return (
                  <article
                    key={`${entry.user_id}-${entry.purchased_at}-${index}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-[#ece3d7] bg-[linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(250,245,239,0.96))] p-4"
                  >
                    <div>
                      <p className="font-semibold text-slate-950">
                        {buyer?.name ?? "Lecteur"} <span className="font-normal text-slate-500">({buyer?.email ?? "email indisponible"})</span>
                      </p>
                      <p className="text-sm text-slate-600">{book?.title ?? "Livre supprime"}</p>
                      <p className="text-xs text-slate-500">Ajout le {new Date(entry.purchased_at).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        isSubscription ? "bg-[#edf4f7] text-[#3d6f83]" : isFree ? "bg-emerald-100 text-emerald-700" : "bg-[#f8efe7] text-[#a85b3f]"
                      }`}
                    >
                      {getLibraryAccessLabel(entry.access_type)}
                    </span>
                  </article>
                );
              })
            ) : (
              <EmptyState title="Aucun lecteur visible" description="Vos prochaines acquisitions lecteur apparaitront ici." />
            )}
          </div>
        </section>

        <div className="grid gap-5">
          <section className="surface-panel-soft p-5">
            <p className="section-kicker">Audience</p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-[1.35rem] bg-white/90 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Lecteurs uniques</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">{uniqueReaders}</p>
              </div>
              <div className="rounded-[1.35rem] bg-white/90 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Lectures gratuites</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">{freeClaims}</p>
              </div>
              <div className="rounded-[1.35rem] bg-white/90 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Lectures Premium</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">{subscriptionClaims}</p>
              </div>
            </div>
          </section>

          <section className="surface-panel p-5">
            <div className="section-header">
              <div className="space-y-2">
                <p className="section-kicker">Catalogue</p>
                <h2 className="section-title text-2xl">Derniers livres</h2>
              </div>
              <Link href="/dashboard/author/books" className="cta-secondary px-4 py-2 text-sm">
                Tout voir
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {recentBooks.length > 0 ? (
                recentBooks.map((book) => (
                  <article key={book.id} className="flex items-center justify-between rounded-[1.35rem] bg-[#faf5ef] p-4">
                    <div>
                      <p className="font-semibold text-slate-950">{book.title}</p>
                      <p className="text-xs text-slate-500">Cree le {new Date(book.created_at).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusMeta[book.status]?.className ?? statusMeta.draft.className}`}>
                        {statusMeta[book.status]?.label ?? statusMeta.draft.label}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${reviewMeta[book.review_status]?.className ?? reviewMeta.draft.className}`}>
                        {reviewMeta[book.review_status]?.label ?? reviewMeta.draft.label}
                      </span>
                    </div>
                  </article>
                ))
              ) : (
                <EmptyState title="Aucun livre ajoute" description="Ajoutez votre premier titre pour commencer a alimenter votre studio auteur." />
              )}
            </div>
          </section>

          <section className="surface-panel-soft p-5">
            <div className="flex items-start gap-3">
              <Users className="mt-1 h-5 w-5 text-[#a85b3f]" />
              <div>
                <p className="text-sm font-semibold text-slate-950">Commununaute active</p>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  Vos acquisitions regroupent maintenant les achats, les lectures gratuites et les lectures via abonnement Premium.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
