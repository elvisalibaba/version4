import Link from "next/link";
import { ArrowRight, BookOpen, CircleDollarSign, Eye, MousePointerClick, Plus, UserRound } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getAuthorDashboard } from "@/lib/author-api";
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

function money(amount: number, currency = "USD") {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
}

export default async function AuthorDashboardPage() {
  const profile = await requireRole(["author"]);
  const data = await getAuthorDashboard();
  const author = data.profile;
  const books = data.recent_books;
  const checks = [author.display_name, author.bio, author.professional_headline, author.avatar_url, author.location, author.genres?.length];
  const profileScore = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  const firstName = (author.display_name || profile.name || "Auteur").split(" ")[0];

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[28px] bg-[#173d2c] p-6 text-white sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#f2c66f]">Espace auteur</p><h1 className="mt-3 font-serif text-3xl sm:text-4xl">Bonjour {firstName}.</h1><p className="mt-2 max-w-xl text-sm leading-6 text-white/65">Vos publications, vues et ventes sont centralisées dans Laravel.</p></div>
          <Link href="/dashboard/author/add-book" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#e8ac42] px-5 text-sm font-bold text-[#173d2c]"><Plus className="h-4 w-4" />Ajouter un livre</Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { label: "Mes livres", value: data.stats.books, icon: BookOpen },
          { label: "Publiés", value: data.stats.published_books, icon: BookOpen },
          { label: "Vues", value: data.stats.views, icon: Eye },
          { label: "Clics", value: data.stats.clicks, icon: MousePointerClick },
          { label: "Revenus", value: money(data.stats.revenue), icon: CircleDollarSign },
        ].map((stat) => {
          const Icon = stat.icon;
          return <article key={stat.label} className="rounded-2xl border border-[#ded3c2] bg-white p-4 sm:p-5"><Icon className="h-5 w-5 text-[#b85135]" /><p className="mt-4 text-2xl font-bold text-[#17231d] sm:text-3xl">{stat.value}</p><p className="mt-1 text-xs font-semibold text-[#766e64]">{stat.label}</p></article>;
        })}
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-[28px] border border-[#ded3c2] bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3"><div><h2 className="font-serif text-2xl text-[#17231d]">Livres récents</h2><p className="mt-1 text-sm text-[#766e64]">L’essentiel de votre catalogue.</p></div><Link href="/dashboard/author/books" className="text-sm font-bold text-[#a94b34]">Tout voir</Link></div>
          <div className="mt-5 divide-y divide-[#e8dfd2]">
            {books.map((book) => {
              const review = (book.review_status ?? "draft") as BookReviewStatus;
              return (
                <article key={book.id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[.65rem] font-bold ${publicationStatus[book.status].className}`}>{publicationStatus[book.status].label}</span><span className="text-xs text-[#887f74]">{reviewStatus[review]}</span></div><h3 className="mt-2 truncate font-semibold text-[#17231d]">{book.title}</h3><p className="mt-1 text-xs text-[#887f74]">{book.views_count ?? 0} vues · {book.clicks_count ?? 0} clics · {book.purchases_count ?? 0} achats</p></div>
                  <Link href={`/dashboard/author/books/${book.id}/edit`} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-[#d9cebd] px-4 text-sm font-bold text-[#173d2c]">Modifier<ArrowRight className="h-3.5 w-3.5" /></Link>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-[28px] border border-[#ded3c2] bg-[#fffaf2] p-5"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#e8ac42] text-[#173d2c]"><UserRound className="h-5 w-5" /></span><strong className="text-2xl text-[#173d2c]">{profileScore}%</strong></div><h2 className="mt-5 font-serif text-xl">Votre profil public</h2><p className="mt-2 text-sm leading-6 text-[#766e64]">Complétez votre identité auteur pour renforcer votre présence.</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e5dacb]"><div className="h-full rounded-full bg-[#173d2c]" style={{ width: `${profileScore}%` }} /></div><Link href="/dashboard/author/profile" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#a94b34]">Compléter mon profil<ArrowRight className="h-4 w-4" /></Link></section>
        </aside>
      </div>
    </div>
  );
}
