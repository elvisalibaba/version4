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
  published: { label: "Publié", style: "bg-emerald-50 text-night-900" },
  draft: { label: "Brouillon", style: "bg-brand-100 text-amber-800" },
  coming_soon: { label: "À venir", style: "bg-night-50 text-night-700" },
  archived: { label: "Archivé", style: "bg-paper-deep text-slate-600" },
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
      <header className="overflow-hidden rounded-md bg-night-900 p-6 text-white sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold text-brand-300">Bibliothèque éditoriale</p>
            <h1 className="mt-3 font-bold text-3xl tracking-[-0.03em] sm:text-4xl">Mes livres</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/65">
              Gérez vos titres, contrôlez leur validation et ouvrez leurs options commerciales et de distribution.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/author/distribution" className="inline-flex h-11 items-center gap-2 rounded-sm border border-white/20 px-4 text-sm font-bold">
              <Globe2 className="h-4 w-4" />
              Distribution
            </Link>
            <Link href="/dashboard/author/finance" className="inline-flex h-11 items-center gap-2 rounded-sm border border-white/20 px-4 text-sm font-bold">
              <CircleDollarSign className="h-4 w-4" />
              Finances
            </Link>
            <Link href="/dashboard/author/add-book" className="inline-flex h-11 items-center gap-2 rounded-sm bg-brand-600 px-4 text-sm font-bold text-white">
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
            <article key={item.label} className="rounded-md border border-rule-strong bg-white p-5 ">
              <Icon className="h-5 w-5 text-brand-600" />
              <p className="mt-4 text-2xl font-bold tracking-[-0.04em] text-night-900">{item.value}</p>
              <p className="mt-1 text-xs font-semibold text-slate-600">{item.label}</p>
              <p className="mt-1 text-[0.68rem] text-slate-500">{item.detail}</p>
            </article>
          );
        })}
      </section>

      {books.length ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {books.map((book) => {
            const reviewStatus = (book.review_status ?? "draft") as BookReviewStatus;

            return (
              <article key={book.id} className="overflow-hidden rounded-md border border-rule-strong bg-white ">
                <div className="flex gap-4 p-5 sm:gap-5 sm:p-6">
                  <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-md bg-night-900 ">
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
                      <span className={`rounded-sm px-2.5 py-1 text-[.65rem] font-bold ${status[book.status].style}`}>{status[book.status].label}</span>
                      <span className="rounded-sm bg-paper-deep px-2.5 py-1 text-[.65rem] font-bold text-slate-600">{review[reviewStatus]}</span>
                      <span className={`rounded-sm px-2.5 py-1 text-[.65rem] font-bold ${book.copyright_status === "clear" ? "bg-emerald-50 text-emerald-700" : book.copyright_status === "blocked" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>
                        {book.copyright_status === "clear" ? "Droits validés" : book.copyright_status === "blocked" ? "Droits bloqués" : "Droits à vérifier"}
                      </span>
                    </div>

                    <h2 className="mt-3 truncate font-bold text-xl text-night-900 sm:text-2xl">{book.title}</h2>
                    {book.subtitle ? <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600">{book.subtitle}</p> : null}

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div className="rounded-md bg-paper p-2.5"><p className="text-[0.62rem] font-bold text-slate-500">Vues</p><p className="mt-1 text-sm font-bold text-night-900">{book.views_count ?? 0}</p></div>
                      <div className="rounded-md bg-paper p-2.5"><p className="text-[0.62rem] font-bold text-slate-500">Clics</p><p className="mt-1 text-sm font-bold text-night-900">{book.clicks_count ?? 0}</p></div>
                      <div className="rounded-md bg-paper p-2.5"><p className="text-[0.62rem] font-bold text-slate-500">Achats</p><p className="mt-1 text-sm font-bold text-night-900">{book.purchases_count ?? 0}</p></div>
                    </div>
                  </div>
                </div>

                {book.review_note ? (
                  <p className="mx-5 mb-4 rounded-md bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800 sm:mx-6">
                    <strong>Message éditorial :</strong> {book.review_note}
                  </p>
                ) : null}

                <div className="flex flex-col gap-3 border-t border-rule bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="text-xs text-slate-500">
                    <span className="font-bold text-night-900">{book.is_single_sale_enabled ? price(book.price, book.currency_code) : "Vente unitaire désactivée"}</span>
                    {book.is_subscription_available ? " · Inclus dans Premium" : ""}
                    <span className="block mt-1">MAJ {book.updated_at ? new Date(book.updated_at).toLocaleDateString("fr-FR") : "—"} · ISBN {book.isbn || "non renseigné"}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href="/dashboard/author/distribution" className="inline-flex h-10 items-center justify-center gap-2 rounded-sm border border-rule-strong px-4 text-sm font-bold text-night-900 hover:bg-paper-deep">
                      <Globe2 className="h-3.5 w-3.5" />
                      Distribuer
                    </Link>
                    <Link href={`/dashboard/author/books/${book.id}/edit`} className="inline-flex h-10 items-center justify-center gap-2 rounded-sm bg-night-900 px-4 text-sm font-bold text-white hover:bg-night-800">
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
        <section className="rounded-md border border-dashed border-rule-strong bg-paper py-20 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-slate-400" />
          <h2 className="mt-4 font-bold text-2xl text-night-900">Votre catalogue est vide</h2>
          <p className="mt-2 text-sm text-slate-600">Commencez par ajouter votre premier livre et préparez sa diffusion.</p>
          <Link href="/dashboard/author/add-book" className="mt-5 inline-flex h-11 items-center gap-2 rounded-sm bg-night-900 px-5 text-sm font-bold text-white"><Plus className="h-4 w-4" />Ajouter un livre</Link>
        </section>
      )}
    </div>
  );
}
