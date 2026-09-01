import Link from "next/link";
import { ArrowRight, BookOpen, CircleDollarSign, Eye, Plus, UserRound } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { BookReviewStatus, Database } from "@/types/database";

type AuthorBook = Pick<Database["public"]["Tables"]["books"]["Row"], "id" | "title" | "status" | "review_status" | "updated_at" | "views_count" | "purchases_count" | "price" | "currency_code">;
type Sale = Database["public"]["Functions"]["get_current_author_sales"]["Returns"][number];
type AuthorProfile = Pick<Database["public"]["Tables"]["author_profiles"]["Row"], "display_name" | "bio" | "professional_headline" | "avatar_url" | "location" | "genres">;

const publicationStatus = {
  published: { label: "Publié", className: "bg-[#e6f3eb] text-[#246343]" },
  draft: { label: "Brouillon", className: "bg-[#f5ead2] text-[#8c621d]" },
  coming_soon: { label: "À venir", className: "bg-[#e6eef3] text-[#365d72]" },
  archived: { label: "Archivé", className: "bg-[#ece9e3] text-[#665f56]" },
} as const;

const reviewStatus: Record<BookReviewStatus, string> = {
  draft: "Non soumis", submitted: "En vérification", approved: "Validé", rejected: "Refusé", changes_requested: "Corrections demandées",
};

function money(amount: number, currency = "USD") {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
}

export default async function AuthorDashboardPage() {
  const profile = await requireRole(["author"]);
  const supabase = await createClient();
  const [{ data: booksData }, { data: salesData }, { data: authorData }] = await Promise.all([
    supabase.from("books").select("id, title, status, review_status, updated_at, views_count, purchases_count, price, currency_code").eq("author_id", profile.id).order("updated_at", { ascending: false }).returns<AuthorBook[]>(),
    supabase.rpc("get_current_author_sales"),
    supabase.from("author_profiles").select("display_name, bio, professional_headline, avatar_url, location, genres").eq("id", profile.id).returns<AuthorProfile>().maybeSingle(),
  ]);

  const books = booksData ?? [];
  const sales = (salesData ?? []) as Sale[];
  const authorProfile = authorData as AuthorProfile | null;
  const paidSales = sales.filter((sale) => sale.payment_status === "paid");
  const revenueByCurrency = new Map<string, number>();
  paidSales.forEach((sale) => {
    const currency = sale.currency_code ?? "USD";
    revenueByCurrency.set(currency, (revenueByCurrency.get(currency) ?? 0) + Number(sale.price ?? 0));
  });
  const revenue = revenueByCurrency.size ? [...revenueByCurrency].map(([currency, amount]) => money(amount, currency)).join(" · ") : "0,00 $US";
  const views = books.reduce((total, book) => total + Number(book.views_count ?? 0), 0);
  const profileChecks = [authorProfile?.display_name, authorProfile?.bio, authorProfile?.professional_headline, authorProfile?.avatar_url, authorProfile?.location, authorProfile?.genres?.length];
  const profileScore = Math.round((profileChecks.filter(Boolean).length / profileChecks.length) * 100);
  const firstName = (authorProfile?.display_name || profile.name || "Auteur").split(" ")[0];

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[28px] bg-[#173d2c] p-6 text-white sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#f2c66f]">Espace auteur</p><h1 className="mt-3 font-serif text-3xl sm:text-4xl">Bonjour {firstName}.</h1><p className="mt-2 max-w-xl text-sm leading-6 text-white/65">Gérez vos livres et suivez leur évolution, simplement.</p></div>
          <Link href="/dashboard/author/add-book" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#e8ac42] px-5 text-sm font-bold text-[#173d2c] hover:bg-[#f2c66f]"><Plus className="h-4 w-4" />Ajouter un livre</Link>
        </div>
      </section>

      <section aria-label="Aperçu" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Mes livres", value: books.length, icon: BookOpen },
          { label: "Publiés", value: books.filter((book) => book.status === "published").length, icon: BookOpen },
          { label: "Vues", value: views, icon: Eye },
          { label: "Revenus", value: revenue, icon: CircleDollarSign },
        ].map((stat) => { const Icon = stat.icon; return <article key={stat.label} className="rounded-2xl border border-[#ded3c2] bg-white p-4 sm:p-5"><Icon className="h-5 w-5 text-[#b85135]" /><p className="mt-4 text-2xl font-bold text-[#17231d] sm:text-3xl">{stat.value}</p><p className="mt-1 text-xs font-semibold text-[#766e64]">{stat.label}</p></article>; })}
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-[28px] border border-[#ded3c2] bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3"><div><h2 className="font-serif text-2xl text-[#17231d]">Livres récents</h2><p className="mt-1 text-sm text-[#766e64]">L’essentiel de votre catalogue.</p></div><Link href="/dashboard/author/books" className="text-sm font-bold text-[#a94b34]">Tout voir</Link></div>
          <div className="mt-5 divide-y divide-[#e8dfd2]">
            {books.slice(0, 5).map((book) => (
              <article key={book.id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[.65rem] font-bold ${publicationStatus[book.status].className}`}>{publicationStatus[book.status].label}</span><span className="text-xs text-[#887f74]">{reviewStatus[book.review_status]}</span></div><h3 className="mt-2 truncate font-semibold text-[#17231d]">{book.title}</h3><p className="mt-1 text-xs text-[#887f74]">{book.views_count ?? 0} vues · {book.purchases_count ?? 0} achats</p></div>
                <Link href={`/dashboard/author/books/${book.id}/edit`} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-[#d9cebd] px-4 text-sm font-bold text-[#173d2c] hover:bg-[#f5f0e7]">Modifier<ArrowRight className="h-3.5 w-3.5" /></Link>
              </article>
            ))}
            {!books.length ? <div className="py-12 text-center"><BookOpen className="mx-auto h-7 w-7 text-[#b8ac9c]" /><h3 className="mt-3 font-semibold">Aucun livre pour le moment</h3><p className="mt-1 text-sm text-[#766e64]">Ajoutez votre premier manuscrit pour commencer.</p></div> : null}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-[28px] border border-[#ded3c2] bg-[#fffaf2] p-5"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#e8ac42] text-[#173d2c]"><UserRound className="h-5 w-5" /></span><strong className="text-2xl text-[#173d2c]">{profileScore}%</strong></div><h2 className="mt-5 font-serif text-xl">Votre profil public</h2><p className="mt-2 text-sm leading-6 text-[#766e64]">Une photo et une biographie complète renforcent la confiance des lecteurs.</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e5dacb]"><div className="h-full rounded-full bg-[#173d2c]" style={{ width: `${profileScore}%` }} /></div><Link href="/dashboard/author/profile" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#a94b34]">Compléter mon profil<ArrowRight className="h-4 w-4" /></Link></section>
          <section className="rounded-[28px] bg-[#c95d3e] p-5 text-white"><p className="text-xs font-bold uppercase tracking-[.18em] text-white/65">Besoin d’aide ?</p><h2 className="mt-3 font-serif text-xl">Faites accompagner votre manuscrit.</h2><Link href="/services" className="mt-5 inline-flex items-center gap-2 text-sm font-bold">Voir les services<ArrowRight className="h-4 w-4" /></Link></section>
        </aside>
      </div>
    </div>
  );
}
