import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookCheck,
  BookOpen,
  CircleDollarSign,
  Clapperboard,
  Eye,
  Headphones,
  Globe2,
  MousePointerClick,
  Plus,
  Receipt,
  TrendingUp,
  UserRound,
  WalletCards,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getAuthorBooks, getAuthorDashboard, getAuthorFinanceSummary } from "@/lib/author-api";
import type { BookReviewStatus, BookStatus } from "@/types/api";

const publicationStatus: Record<BookStatus, { label: string; className: string }> = {
  published: { label: "Publié", className: "bg-emerald-50 text-emerald-700" },
  draft: { label: "Brouillon", className: "bg-brand-100 text-amber-800" },
  coming_soon: { label: "À venir", className: "bg-night-50 text-night-700" },
  archived: { label: "Archivé", className: "bg-slate-200 text-slate-600" },
};

const reviewStatus: Record<BookReviewStatus, string> = {
  draft: "Non soumis",
  submitted: "En vérification",
  approved: "Validé",
  rejected: "Refusé",
  changes_requested: "Corrections demandées",
};

function money(amount: number | string | null | undefined, currency = "USD") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount ?? 0));
}

function percent(value: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(value);
}

export default async function AuthorDashboardPage() {
  const profile = await requireRole(["author"]);
  const [data, allBooks, finance] = await Promise.all([
    getAuthorDashboard(),
    getAuthorBooks(),
    getAuthorFinanceSummary(),
  ]);

  const author = data.profile;
  const books = data.recent_books;
  const checks = [
    author.display_name,
    author.bio,
    author.professional_headline,
    author.avatar_url,
    author.location,
    author.genres?.length,
  ];
  const profileScore = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  const firstName = (author.display_name || profile.name || "Auteur").split(" ")[0];

  const views = Number(data.stats.views || 0);
  const clicks = Number(data.stats.clicks || 0);
  const purchases = Number(data.stats.purchases || 0);
  const clickRate = views > 0 ? (clicks / views) * 100 : 0;
  const purchaseRate = clicks > 0 ? (purchases / clicks) * 100 : 0;
  const avgOrder = purchases > 0 ? Number(data.stats.revenue || 0) / purchases : 0;

  const pipeline = {
    draft: allBooks.filter((book) => (book.review_status ?? "draft") === "draft").length,
    submitted: allBooks.filter((book) => book.review_status === "submitted").length,
    changes: allBooks.filter((book) => book.review_status === "changes_requested" || book.review_status === "rejected").length,
    published: allBooks.filter((book) => book.status === "published").length,
  };

  const currency = finance.account?.currency_code ?? "USD";
  const rankedBooks = [...allBooks]
    .sort((a, b) => (b.purchases_count ?? 0) - (a.purchases_count ?? 0) || (b.views_count ?? 0) - (a.views_count ?? 0))
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-xl bg-night-900 p-6 text-white shadow-md sm:p-8">
        <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-brand-300">
              <TrendingUp className="h-3.5 w-3.5" />
              Holistique Author Studio
            </div>
            <h1 className="mt-4 font-bold text-3xl tracking-[-0.04em] sm:text-5xl">Bonjour {firstName}.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/68 sm:text-base">
              Publiez vos livres, suivez vos ventes et encaissez vos royalties depuis un seul espace.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/author/distribution" className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 text-sm font-bold transition hover:bg-white/10">
              <Globe2 className="h-4 w-4" />
              Distribution
            </Link>
            <Link href="/dashboard/author/add-book" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand-600 px-5 text-sm font-bold text-white transition hover:bg-brand-700">
              <Plus className="h-4 w-4" />
              Publier un livre
            </Link>
          </div>
        </div>

        <div className="relative z-10 mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-white/12 bg-white/8 p-4">
            <p className="text-xs font-bold text-white/55">Royalties disponibles</p>
            <p className="mt-2 text-2xl font-bold">{money(finance.account?.available_balance, currency)}</p>
          </div>
          <div className="rounded-lg border border-white/12 bg-white/8 p-4">
            <p className="text-xs font-bold text-white/55">En attente</p>
            <p className="mt-2 text-2xl font-bold">{money(finance.royalties.pending, currency)}</p>
          </div>
          <div className="rounded-lg border border-white/12 bg-white/8 p-4">
            <p className="text-xs font-bold text-white/55">Gains cumulés</p>
            <p className="mt-2 text-2xl font-bold">{money(finance.account?.lifetime_earnings ?? finance.royalties.lifetime, currency)}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        {[
          { label: "Livres", value: data.stats.books, icon: BookOpen, detail: `${data.stats.published_books} publiés` },
          { label: "Vues", value: views.toLocaleString("fr-FR"), icon: Eye, detail: "Visibilité catalogue" },
          { label: "Clics", value: clicks.toLocaleString("fr-FR"), icon: MousePointerClick, detail: `${percent(clickRate)}% des vues` },
          { label: "Achats", value: purchases.toLocaleString("fr-FR"), icon: Receipt, detail: `${percent(purchaseRate)}% des clics` },
          { label: "Chiffre d’affaires", value: money(data.stats.revenue), icon: CircleDollarSign, detail: `Panier moyen ${money(avgOrder)}` },
          { label: "Royalties", value: money(finance.royalties.lifetime, currency), icon: WalletCards, detail: "Gains auteur" },
          { label: "Audio", value: data.stats.audiobooks, icon: Headphones, detail: "Éditions audio" },
          { label: "Vidéo", value: data.stats.videos, icon: Clapperboard, detail: "Éditions vidéo" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <article key={stat.label} className="rounded-xl border border-slate-300 bg-white p-4 shadow-md sm:p-5">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-brand-600"><Icon className="h-4.5 w-4.5" /></span>
              <p className="mt-4 truncate text-xl font-bold tracking-[-0.04em] text-night-900 sm:text-2xl">{stat.value}</p>
              <p className="mt-1 text-xs font-bold text-slate-600">{stat.label}</p>
              <p className="mt-1 truncate text-[0.68rem] text-slate-500">{stat.detail}</p>
            </article>
          );
        })}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
        <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-6">
          <Headphones className="h-6 w-6 text-night-900" />
          <p className="mt-5 text-xs font-bold text-night-900">Livre audio</p>
          <h2 className="mt-2 font-bold text-2xl text-night-900">Votre œuvre peut aussi s’écouter.</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Narrateur, durée, chapitres, extraits et diffusion seront rattachés au même titre et aux mêmes droits.</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-6">
          <Clapperboard className="h-6 w-6 text-brand-600" />
          <p className="mt-5 text-xs font-bold text-brand-600">Édition vidéo</p>
          <h2 className="mt-2 font-bold text-2xl text-night-900">Cours, entretiens et formats enrichis.</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Proposez des cours, entretiens et présentations vidéo rattachés à votre livre.</p>
        </article>
      </section>

      <section className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold text-brand-600">Performance</p>
              <h2 className="mt-2 font-bold text-2xl text-night-900">Vos titres les plus actifs</h2>
              <p className="mt-1 text-sm text-slate-600">Une lecture rapide des vues, clics et achats par livre.</p>
            </div>
            <Link href="/dashboard/author/books" className="inline-flex items-center gap-2 text-sm font-bold text-brand-600">Catalogue complet <ArrowRight className="h-4 w-4" /></Link>
          </div>

          <div className="mt-5 grid gap-3">
            {rankedBooks.map((book, index) => {
              const maxViews = Math.max(1, ...rankedBooks.map((item) => Number(item.views_count ?? 0)));
              const width = Math.max(5, (Number(book.views_count ?? 0) / maxViews) * 100);
              const review = (book.review_status ?? "draft") as BookReviewStatus;

              return (
                <article key={book.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-night-900 text-[0.68rem] font-bold text-white">{index + 1}</span>
                        <h3 className="truncate font-semibold text-night-900">{book.title}</h3>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{reviewStatus[review]} · {book.purchases_count ?? 0} achat(s)</p>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-600">
                      <span><strong className="text-night-900">{book.views_count ?? 0}</strong> vues</span>
                      <span><strong className="text-night-900">{book.clicks_count ?? 0}</strong> clics</span>
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-brand-600" style={{ width: `${width}%` }} />
                  </div>
                </article>
              );
            })}
            {!rankedBooks.length ? <p className="py-10 text-center text-sm text-slate-500">Publiez votre premier titre pour démarrer les statistiques.</p> : null}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-xl border border-slate-300 bg-slate-50 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-brand-600">Pipeline éditorial</p>
                <h2 className="mt-2 font-bold text-xl text-night-900">Où en sont vos livres ?</h2>
              </div>
              <BookCheck className="h-5 w-5 text-night-900" />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                ["Brouillons", pipeline.draft],
                ["En vérification", pipeline.submitted],
                ["À corriger", pipeline.changes],
                ["Publiés", pipeline.published],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-2xl font-bold text-night-900">{value}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-600">{label}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-300 bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-600 text-white"><UserRound className="h-5 w-5" /></span>
              <strong className="text-2xl text-night-900">{profileScore}%</strong>
            </div>
            <h2 className="mt-5 font-bold text-xl text-night-900">Profil public</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Une fiche auteur complète améliore la confiance des lecteurs, libraires et partenaires.</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-300"><div className="h-full rounded-full bg-night-900" style={{ width: `${profileScore}%` }} /></div>
            <Link href="/dashboard/author/profile" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-600">Compléter mon profil <ArrowRight className="h-4 w-4" /></Link>
          </section>
        </aside>
      </div>

      <section className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold text-brand-600">Catalogue récent</p>
            <h2 className="mt-2 font-bold text-2xl text-night-900">Dernières publications</h2>
          </div>
          <Link href="/dashboard/author/books" className="text-sm font-bold text-brand-600">Voir tous les livres</Link>
        </div>

        <div className="mt-5 divide-y divide-slate-200">
          {books.map((book) => {
            const review = (book.review_status ?? "draft") as BookReviewStatus;
            return (
              <article key={book.id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[.65rem] font-bold ${publicationStatus[book.status].className}`}>{publicationStatus[book.status].label}</span>
                    <span className="text-xs text-slate-500">{reviewStatus[review]}</span>
                  </div>
                  <h3 className="mt-2 truncate font-semibold text-night-900">{book.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">{book.views_count ?? 0} vues · {book.clicks_count ?? 0} clics · {book.purchases_count ?? 0} achats</p>
                </div>
                <Link href={`/dashboard/author/books/${book.id}/edit`} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-slate-300 px-4 text-sm font-bold text-night-900 transition hover:bg-slate-100">Modifier <ArrowRight className="h-3.5 w-3.5" /></Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { href: "/dashboard/author/add-book", title: "Publier", copy: "Ajouter PDF/EPUB et métadonnées.", icon: Plus },
          { href: "/dashboard/author/finance", title: "Encaisser", copy: "Royalties, Mobile Money et banque.", icon: WalletCards },
          { href: "/dashboard/author/distribution", title: "Distribuer", copy: "Marchés, librairies et impression.", icon: Globe2 },
          { href: "/dashboard/author/sales", title: "Analyser", copy: "Suivre chaque vente confirmée.", icon: BarChart3 },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="group rounded-xl border border-slate-300 bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md">
              <Icon className="h-5 w-5 text-brand-600" />
              <h3 className="mt-4 font-semibold text-night-900">{item.title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{item.copy}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-night-900">Ouvrir <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></span>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
