import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  CircleDollarSign,
  Eye,
  Globe2,
  Pencil,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getAuthorBooks } from "@/lib/author-api";
import type { BookReviewStatus, BookStatus } from "@/types/api";

const status: Record<BookStatus, { label: string; style: string }> = {
  published: { label: "Publié", style: "bg-[#e4f1e9] text-[#246343]" },
  draft: { label: "Brouillon", style: "bg-[#f5ead2] text-[#89611d]" },
  coming_soon: { label: "À venir", style: "bg-[#e6eef3] text-[#365d72]" },
  archived: { label: "Archivé", style: "bg-[#ece9e3] text-[#665f56]" },
};

const review: Record<BookReviewStatus, string> = {
  draft: "Non soumis",
  submitted: "En cours de vérification",
  approved: "Validé",
  rejected: "Refusé",
  changes_requested: "Corrections demandées",
};

function price(value: number | string, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

export default async function AuthorBooksPage() {
  await requireRole(["author"]);
  const books = await getAuthorBooks();

  const published = books.filter((book) => book.status === "published").length;
  const inReview = books.filter((book) => book.review_status === "submitted").length;
  const totalViews = books.reduce((sum, book) => sum + Number(book.views_count ?? 0), 0);
  const totalPurchases = books.reduce((sum, book) => sum + Number(book.purchases_count ?? 0), 0);

  return (
    <div className="space-y-6">
      <header className="overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_top_right,rgba(232,172,66,0.28),transparent_35%),linear-gradient(135deg,#102a20,#173d2c)] p-6 text-white shadow-[0_28px_70px_rgba(23,61,44,0.16)] sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#f2c66f]">Bibliothèque éditoriale</p>
            <h1 className="mt-3 font-serif text-3xl tracking-[-0.03em] sm:text-4xl">Mes livres</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/65">
              Gérez vos titres, contrôlez leur validation et ouvrez leurs options commerciales et de distribution.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/author/distribution" className="inline-flex h-11 items-center gap-2 rounded-full border border-white/20 px-4 text-sm font-bold">
              <Globe2 className="h-4 w-4" />
              Distribution
            </Link>
            <Link href="/dashboard/author/finance" className="inline-flex h-11 items-center gap-2 rounded-full border border-white/20 px-4 text-sm font-bold">
              <CircleDollarSign className="h-4 w-4" />
              Finances
            </Link>
            <Link href="/dashboard/author/add-book" className="inline-flex h-11 items-center gap-2 rounded-full bg-[#e8ac42] px-4 text-sm font-bold text-[#173d2c]">
              <Plus className="h-4 w-4" />
              Nouveau titre
            </Link>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Titres", value: books.length, detail: `${published} publiés`, icon: BookOpen },
          { label: "En vérification", value: inReview, detail: "Soumis à l’équipe", icon: ShieldCheck },
          { label: "Vues", value: totalViews.toLocaleString("fr-FR"), detail: "Tous les titres", icon: Eye },
          { label: "Achats", value: totalPurchases.toLocaleString("fr-FR"), detail: "Tous les formats", icon: BarChart3 },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="rounded-[22px] border border-[#e5ddd1] bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
              <Icon className="h-5 w-5 text-[#b85135]" />
              <p className="mt-4 text-2xl font-bold tracking-[-0.04em] text-[#17231d]">{item.value}</p>
              <p className="mt-1 text-xs font-semibold text-[#766e64]">{item.label}</p>
              <p className="mt-1 text-[0.68rem] text-[#92887c]">{item.detail}</p>
            </article>
          );
        })}
      </section>

      {books.length ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {books.map((book) => {
            const reviewStatus = (book.review_status ?? "draft") as BookReviewStatus;

            return (
              <article key={book.id} className="overflow-hidden rounded-[28px] border border-[#e5ddd1] bg-white shadow-[0_16px_44px_rgba(15,23,42,0.05)]">
                <div className="flex gap-4 p-5 sm:gap-5 sm:p-6">
                  <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-[14px] bg-[linear-gradient(145deg,#173d2c,#a94b34)] shadow-[0_14px_28px_rgba(15,23,42,0.16)]">
                    {book.cover_url ? (
                      <Image
                        src={book.cover_url}
                        alt={book.cover_alt_text || `Couverture de ${book.title}`}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="grid h-full place-items-center p-3 text-center text-white">
                        <BookOpen className="h-6 w-6" />
                        <span className="mt-2 line-clamp-3 text-[0.62rem] font-bold">{book.title}</span>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[.65rem] font-bold ${status[book.status].style}`}>{status[book.status].label}</span>
                      <span className="rounded-full bg-[#f4f0ea] px-2.5 py-1 text-[.65rem] font-bold text-[#665f56]">{review[reviewStatus]}</span>
                      <span className={`rounded-full px-2.5 py-1 text-[.65rem] font-bold ${book.copyright_status === "clear" ? "bg-[#e9f7ee] text-[#237a43]" : book.copyright_status === "blocked" ? "bg-red-50 text-red-700" : "bg-[#fff2da] text-[#936317]"}`}>
                        {book.copyright_status === "clear" ? "Droits validés" : book.copyright_status === "blocked" ? "Droits bloqués" : "Droits à vérifier"}
                      </span>
                    </div>

                    <h2 className="mt-3 truncate font-serif text-xl text-[#17231d] sm:text-2xl">{book.title}</h2>
                    {book.subtitle ? <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#766e64]">{book.subtitle}</p> : null}

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div className="rounded-xl bg-[#faf7f2] p-2.5"><p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-[#978d82]">Vues</p><p className="mt-1 text-sm font-bold text-[#17231d]">{book.views_count ?? 0}</p></div>
                      <div className="rounded-xl bg-[#faf7f2] p-2.5"><p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-[#978d82]">Clics</p><p className="mt-1 text-sm font-bold text-[#17231d]">{book.clicks_count ?? 0}</p></div>
                      <div className="rounded-xl bg-[#faf7f2] p-2.5"><p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-[#978d82]">Achats</p><p className="mt-1 text-sm font-bold text-[#17231d]">{book.purchases_count ?? 0}</p></div>
                    </div>
                  </div>
                </div>

                {book.review_note ? (
                  <p className="mx-5 mb-4 rounded-xl bg-[#fff4e2] px-4 py-3 text-sm leading-6 text-[#76522b] sm:mx-6">
                    <strong>Message éditorial :</strong> {book.review_note}
                  </p>
                ) : null}

                <div className="flex flex-col gap-3 border-t border-[#eee5da] bg-[#fffdf9] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="text-xs text-[#887f74]">
                    <span className="font-bold text-[#17231d]">{book.is_single_sale_enabled ? price(book.price, book.currency_code) : "Vente unitaire désactivée"}</span>
                    {book.is_subscription_available ? " · Inclus dans Premium" : ""}
                    <span className="block mt-1">MAJ {book.updated_at ? new Date(book.updated_at).toLocaleDateString("fr-FR") : "—"} · ISBN {book.isbn || "non renseigné"}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href="/dashboard/author/distribution" className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#d9cebd] px-4 text-sm font-bold text-[#173d2c] hover:bg-[#f5f0e7]">
                      <Globe2 className="h-3.5 w-3.5" />
                      Distribuer
                    </Link>
                    <Link href={`/dashboard/author/books/${book.id}/edit`} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#173d2c] px-4 text-sm font-bold text-white hover:bg-[#0f2d20]">
                      <Pencil className="h-3.5 w-3.5" />
                      Modifier
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="rounded-[28px] border border-dashed border-[#d8ccbc] bg-[#fffaf3] py-20 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-[#b7aa9a]" />
          <h2 className="mt-4 font-serif text-2xl text-[#17231d]">Votre catalogue est vide</h2>
          <p className="mt-2 text-sm text-[#766e64]">Commencez par ajouter votre premier livre et préparez sa diffusion.</p>
          <Link href="/dashboard/author/add-book" className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-[#173d2c] px-5 text-sm font-bold text-white"><Plus className="h-4 w-4" />Ajouter un livre</Link>
        </section>
      )}
    </div>
  );
}
