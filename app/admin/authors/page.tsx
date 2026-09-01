import Link from "next/link";
import { ArrowLeft, MapPin, Search, UserRound, Users } from "lucide-react";
import { AdminNotice } from "@/components/admin/shared/admin-notice";
import { AdminPagination } from "@/components/admin/tables/admin-pagination";
import { formatMoney } from "@/lib/book-offers";
import { listAdminAuthors } from "@/lib/supabase/admin/authors";

type Props = { searchParams: Promise<{ q?: string; page?: string }> };

export default async function AdminAuthorsPage({ searchParams }: Props) {
  const { q, page } = await searchParams;
  const data = await listAdminAuthors({ page: page ? Number(page) : 1, search: q });

  return <div className="space-y-5 pb-10">
    <header className="flex flex-col gap-5 rounded-[28px] bg-[#173d2c] p-6 text-white sm:flex-row sm:items-end sm:justify-between sm:p-8"><div><Link href="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-white/65"><ArrowLeft className="h-4 w-4" />Vue d’ensemble</Link><p className="mt-7 text-xs font-bold uppercase tracking-[.2em] text-[#f2c66f]">Communauté éditoriale</p><h1 className="mt-3 font-serif text-3xl sm:text-4xl">Auteurs</h1><p className="mt-2 text-sm text-white/65">Consultez leurs profils, leurs livres et leurs performances.</p></div><span className="rounded-full border border-white/20 px-4 py-2 text-sm font-bold">{data.pagination.total} auteur{data.pagination.total > 1 ? "s" : ""}</span></header>

    {data.notices.length ? <div className="grid gap-3 md:grid-cols-2">{data.notices.map((notice) => <AdminNotice key={notice.id} tone={notice.tone} title={notice.title} description={notice.description} />)}</div> : null}

    <form action="/admin/authors" className="flex gap-2 rounded-[24px] border border-[#ded3c2] bg-white p-4"><label className="relative min-w-0 flex-1"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#887f74]" /><input name="q" defaultValue={q} placeholder="Nom, email ou localisation" className="h-12 w-full rounded-full border border-[#d9cebd] bg-[#fffaf2] pl-10 pr-4 text-base outline-none focus:border-[#173d2c]" /></label><button className="h-12 rounded-full bg-[#173d2c] px-5 text-sm font-bold text-white">Rechercher</button></form>

    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.items.map((author) => <article key={author.id} className="rounded-[26px] border border-[#ded3c2] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg"><div className="flex items-start gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#e8ac42] font-serif text-lg font-bold text-[#173d2c]">{author.displayName.slice(0, 2).toUpperCase()}</span><div className="min-w-0"><h2 className="truncate font-serif text-xl text-[#17231d]">{author.displayName}</h2><p className="mt-1 truncate text-xs text-[#837a70]">{author.email || "Email non renseigné"}</p>{author.location ? <p className="mt-2 flex items-center gap-1 text-xs text-[#766e64]"><MapPin className="h-3.5 w-3.5" />{author.location}</p> : null}</div></div><div className="mt-5 grid grid-cols-3 divide-x divide-[#e8dfd2] rounded-2xl bg-[#fffaf2] py-3 text-center"><div><strong className="block text-lg text-[#17231d]">{author.booksCount}</strong><span className="text-[.65rem] text-[#837a70]">Livres</span></div><div><strong className="block text-lg text-[#17231d]">{author.totalViews}</strong><span className="text-[.65rem] text-[#837a70]">Vues</span></div><div><strong className="block text-lg text-[#17231d]">{author.totalPurchases}</strong><span className="text-[.65rem] text-[#837a70]">Achats</span></div></div><div className="mt-4 flex items-center justify-between gap-3"><div><p className="text-[.65rem] font-bold uppercase tracking-[.14em] text-[#92887c]">Ventes estimées</p><p className="mt-1 font-bold text-[#17231d]">{formatMoney(author.estimatedSales)}</p></div><Link href={`/admin/authors/${author.id}`} className="inline-flex h-10 items-center gap-2 rounded-full border border-[#d9cebd] px-4 text-sm font-bold text-[#173d2c]"><UserRound className="h-4 w-4" />Voir</Link></div></article>)}
      {!data.items.length ? <div className="col-span-full rounded-[28px] border border-[#ded3c2] bg-white py-20 text-center"><Users className="mx-auto h-8 w-8 text-[#b7aa9a]" /><h2 className="mt-4 font-serif text-2xl">Aucun auteur trouvé</h2><p className="mt-2 text-sm text-[#766e64]">Essayez une autre recherche.</p></div> : null}
    </section>
    <AdminPagination basePath="/admin/authors" pagination={data.pagination} params={{ q: q ?? "" }} />
  </div>;
}
