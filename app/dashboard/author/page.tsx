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
  published: { label: "Publié", className: "bg-[#e6f3eb] text-[#246343]" },
  draft: { label: "Brouillon", className: "bg-[#f5ead2] text-[#8c621d]" },
  coming_soon: { label: "À venir", className: "bg-[#e6eef3] text-[#365d72]" },
  archived: { label: "Archivé", className: "bg-[#ece9e3] text-[#665f56]" },
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
      <section className="relative overflow-hidden rounded-[34px] bg-[radial-gradient(circle_at_85%_15%,rgba(232,172,66,0.32),transparent_28%),radial-gradient(circle_at_10%_100%,rgba(74,132,101,0.34),transparent_30%),linear-gradient(135deg,#102a20,#173d2c_55%,#214d39)] p-6 text-white shadow-[0_30px_80px_rgba(23,61,44,0.20)] sm:p-8">
        <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#f2c66f]">
              <TrendingUp className="h-3.5 w-3.5" />
              Holistique Author Studio
            </div>
            <h1 className="mt-4 font-serif text-3xl tracking-[-0.04em] sm:text-5xl">Bonjour {firstName}.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/68 sm:text-base">
              Publiez, mesurez, distribuez et encaissez depuis un espace auteur connecté à votre backend Laravel et à MySQL.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/author/distribution" className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 text-sm font-bold transition hover:bg-white/10">
              <Globe2 className="h-4 w-4" />
              Distribution
            </Link>
            <Link href="/dashboard/author/add-book" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#e8ac42] px-5 text-sm font-bold text-[#173d2c] transition hover:bg-[#efba59]">
              <Plus className="h-4 w-4" />
              Publier un livre
            </Link>
          </div>
        </div>

        <div className="relative z-10 mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[20px] border border-white/12 bg-white/8 p-4 backdrop-blur">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/55">Royalties disponibles</p>
            <p className="mt-2 text-2xl font-bold">{money(finance.account?.available_balance, currency)}</p>
          </div>
          <div className="rounded-[20px] border border-white/12 bg-white/8 p-4 backdrop-blur">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/55">En attente</p>
            <p className="mt-2 text-2xl font-bold">{money(finance.royalties.pending, currency)}</p>
          </div>
          <div className="rounded-[20px] border border-white/12 bg-white/8 p-4 backdrop-blur">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/55">Gains cumulés</p>
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
            <article key={stat.label} className="rounded-[22px] border border-[#e5ddd1] bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.04)] sm:p-5">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#f6f0e7] text-[#a94b34]"><Icon className="h-4.5 w-4.5" /></span>
              <p className="mt-4 truncate text-xl font-bold tracking-[-0.04em] text-[#17231d] sm:text-2xl">{stat.value}</p>
              <p className="mt-1 text-xs font-bold text-[#5f574f]">{stat.label}</p>
              <p className="mt-1 truncate text-[0.68rem] text-[#92887c]">{stat.detail}</p>
            </article>
          );
        })}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
        <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[30px] border border-[#d8e5dd] bg-[#eef7f2] p-6">
          <Headphones className="h-6 w-6 text-[#173d2c]" />
          <p className="mt-5 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#39705a]">Livre audio</p>
          <h2 className="mt-2 font-serif text-2xl text-[#17231d]">Votre œuvre peut aussi s’écouter.</h2>
          <p className="mt-2 text-sm leading-6 text-[#5f6d65]">Narrateur, durée, chapitres, extraits et diffusion seront rattachés au même titre et aux mêmes droits.</p>
        </article>
        <article className="rounded-[30px] border border-[#eadbd7] bg-[#fff3ef] p-6">
          <Clapperboard className="h-6 w-6 text-[#a94b34]" />
          <p className="mt-5 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#a94b34]">Édition vidéo</p>
          <h2 className="mt-2 font-serif text-2xl text-[#17231d]">Cours, entretiens et formats enrichis.</h2>
          <p className="mt-2 text-sm leading-6 text-[#766e64]">Le backend est prêt à gérer streaming, preview, durée, présentateur et disponibilité mobile.</p>
        </article>
      </section>

      <section className="rounded-[30px] border border-[#e5ddd1] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#a94b34]">Performance</p>
              <h2 className="mt-2 font-serif text-2xl text-[#17231d]">Vos titres les plus actifs</h2>
              <p className="mt-1 text-sm text-[#766e64]">Une lecture rapide des vues, clics et achats par livre.</p>
            </div>
            <Link href="/dashboard/author/books" className="inline-flex items-center gap-2 text-sm font-bold text-[#a94b34]">Catalogue complet <ArrowRight className="h-4 w-4" /></Link>
          </div>

          <div className="mt-5 grid gap-3">
            {rankedBooks.map((book, index) => {
              const maxViews = Math.max(1, ...rankedBooks.map((item) => Number(item.views_count ?? 0)));
              const width = Math.max(5, (Number(book.views_count ?? 0) / maxViews) * 100);
              const review = (book.review_status ?? "draft") as BookReviewStatus;

              return (
                <article key={book.id} className="rounded-[20px] border border-[#eee5da] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#173d2c] text-[0.68rem] font-bold text-white">{index + 1}</span>
                        <h3 className="truncate font-semibold text-[#17231d]">{book.title}</h3>
                      </div>
                      <p className="mt-2 text-xs text-[#887f74]">{reviewStatus[review]} · {book.purchases_count ?? 0} achat(s)</p>
                    </div>
                    <div className="flex gap-4 text-xs text-[#5f574f]">
                      <span><strong className="text-[#17231d]">{book.views_count ?? 0}</strong> vues</span>
                      <span><strong className="text-[#17231d]">{book.clicks_count ?? 0}</strong> clics</span>
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eee8df]">
                    <div className="h-full rounded-full bg-[linear-gradient(90deg,#173d2c,#e8ac42)]" style={{ width: `${width}%` }} />
                  </div>
                </article>
              );
            })}
            {!rankedBooks.length ? <p className="py-10 text-center text-sm text-[#887f74]">Publiez votre premier titre pour démarrer les statistiques.</p> : null}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-[30px] border border-[#e5ddd1] bg-[#fffaf2] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#a94b34]">Pipeline éditorial</p>
                <h2 className="mt-2 font-serif text-xl text-[#17231d]">Où en sont vos livres ?</h2>
              </div>
              <BookCheck className="h-5 w-5 text-[#173d2c]" />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                ["Brouillons", pipeline.draft],
                ["En vérification", pipeline.submitted],
                ["À corriger", pipeline.changes],
                ["Publiés", pipeline.published],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-[18px] border border-[#e9dfd2] bg-white p-4">
                  <p className="text-2xl font-bold text-[#17231d]">{value}</p>
                  <p className="mt-1 text-xs font-semibold text-[#766e64]">{label}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[30px] border border-[#e5ddd1] bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#e8ac42] text-[#173d2c]"><UserRound className="h-5 w-5" /></span>
              <strong className="text-2xl text-[#173d2c]">{profileScore}%</strong>
            </div>
            <h2 className="mt-5 font-serif text-xl text-[#17231d]">Profil public</h2>
            <p className="mt-2 text-sm leading-6 text-[#766e64]">Une fiche auteur complète améliore la confiance des lecteurs, libraires et partenaires.</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e5dacb]"><div className="h-full rounded-full bg-[#173d2c]" style={{ width: `${profileScore}%` }} /></div>
            <Link href="/dashboard/author/profile" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#a94b34]">Compléter mon profil <ArrowRight className="h-4 w-4" /></Link>
          </section>
        </aside>
      </div>

      <section className="rounded-[30px] border border-[#e5ddd1] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#a94b34]">Catalogue récent</p>
            <h2 className="mt-2 font-serif text-2xl text-[#17231d]">Dernières publications</h2>
          </div>
          <Link href="/dashboard/author/books" className="text-sm font-bold text-[#a94b34]">Voir tous les livres</Link>
        </div>

        <div className="mt-5 divide-y divide-[#e8dfd2]">
          {books.map((book) => {
            const review = (book.review_status ?? "draft") as BookReviewStatus;
            return (
              <article key={book.id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[.65rem] font-bold ${publicationStatus[book.status].className}`}>{publicationStatus[book.status].label}</span>
                    <span className="text-xs text-[#887f74]">{reviewStatus[review]}</span>
                  </div>
                  <h3 className="mt-2 truncate font-semibold text-[#17231d]">{book.title}</h3>
                  <p className="mt-1 text-xs text-[#887f74]">{book.views_count ?? 0} vues · {book.clicks_count ?? 0} clics · {book.purchases_count ?? 0} achats</p>
                </div>
                <Link href={`/dashboard/author/books/${book.id}/edit`} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-[#d9cebd] px-4 text-sm font-bold text-[#173d2c] transition hover:bg-[#f5f0e7]">Modifier <ArrowRight className="h-3.5 w-3.5" /></Link>
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
            <Link key={item.href} href={item.href} className="group rounded-[22px] border border-[#e5ddd1] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#cdbba7] hover:shadow-[0_18px_44px_rgba(15,23,42,0.07)]">
              <Icon className="h-5 w-5 text-[#a94b34]" />
              <h3 className="mt-4 font-semibold text-[#17231d]">{item.title}</h3>
              <p className="mt-1 text-sm leading-6 text-[#7b7268]">{item.copy}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#173d2c]">Ouvrir <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></span>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
