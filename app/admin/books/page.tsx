import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getBookCoverUrl } from "@/lib/supabase/book-covers";
import { requireAdmin } from "@/lib/auth/require-admin";
import { BulkPublishForm, BULK_FORM_ID } from "@/components/admin/bulk-publish-form";

export const dynamic = "force-dynamic";
type Filters = { filter?: string; q?: string; page?: string };
const tabs=[
 {key:"all",label:"Tous"},
 {key:"submitted",label:"À valider"},
 {key:"draft",label:"Brouillons"},
 {key:"changes_requested",label:"Corrections"},
 {key:"rejected",label:"Refusés"},
 {key:"approved",label:"Approuvés"},
 {key:"published",label:"Publiés"},
 {key:"coming_soon",label:"À paraître"},
 {key:"archived",label:"Archives"},
];
const reviewColors:Record<string,string>={
 submitted:"bg-amber-50 text-amber-900",draft:"bg-slate-100 text-slate-700",
 approved:"bg-emerald-50 text-emerald-800",rejected:"bg-red-50 text-red-800",
 changes_requested:"bg-orange-50 text-orange-900"
};
export default async function AdminBooksPage({searchParams}:{searchParams:Promise<Filters>}){
 await requireAdmin();
 const {filter="all",q="",page="1"}=await searchParams;
 const selected=tabs.some(t=>t.key===filter)?filter:"all";
 const query=q.replace(/[%_,]/g," ").trim().slice(0,90);
 const currentPage=Math.max(1,Math.min(500,Number.parseInt(page,10)||1));
 const size=24;
 const db=await createClient();
 let booksQuery=db.from("books").select("id,title,author_display_name,status,review_status,copyright_status,price,currency_code,created_at,cover_url,cover_thumbnail_url,cover_bucket,author_id,admin_imported_by",{count:"exact"});
 if(["submitted","draft","approved","rejected","changes_requested"].includes(selected))booksQuery=booksQuery.eq("review_status",selected);
 if(["published","coming_soon","archived"].includes(selected))booksQuery=booksQuery.eq("status",selected);
 if(query)booksQuery=booksQuery.or(`title.ilike.%${query}%,author_display_name.ilike.%${query}%`);
 const [{data,error,count},pending,admins]=await Promise.all([
  booksQuery.order("created_at",{ascending:false}).range((currentPage-1)*size,currentPage*size-1),
  db.from("books").select("id",{head:true,count:"exact"}).eq("review_status","submitted"),
  db.from("profiles").select("id").eq("role","admin"),
 ]);
 // Livre ajouté par l'équipe (même règle que hb_book_added_by_admin en base) et encore publiable.
 const adminIds=new Set(((admins.data??[]) as Array<{id:string}>).map(a=>a.id));
 const items=await Promise.all((data??[]).map(async book=>({
  ...book,cover:await getBookCoverUrl(db,book,true),
  quickPublish:(!!book.admin_imported_by||!book.author_id||adminIds.has(book.author_id))&&book.status!=="published"&&book.copyright_status!=="blocked",
 })));
 const eligibleCount=items.filter(book=>book.quickPublish).length;
 const total=count??0,lastPage=Math.max(1,Math.ceil(total/size));
 function makeHref(nextFilter:string,nextPage=1){const qp=new URLSearchParams();if(nextFilter!=="all")qp.set("filter",nextFilter);if(query)qp.set("q",query);if(nextPage>1)qp.set("page",String(nextPage));return "/dashboard/admin/books"+(qp.size?"?"+qp.toString():"");}
 return <section className="space-y-5">
  <header className="flex flex-wrap items-end justify-between gap-3">
   <div><p className="text-xs font-bold uppercase tracking-widest text-brand-600">Catalogue professionnel</p>
    <h1 className="mt-2 text-3xl font-black text-night-900">Livres & validation</h1>
    <p className="mt-2 text-sm text-slate-600">Filtrez les livres à examiner, visualisez leurs couvertures et gérez les décisions éditoriales.</p>
   </div>
   <Link href="/dashboard/admin/books/new" className="rounded-sm bg-night-900 px-5 py-3 text-sm font-bold text-white">+ Nouveau livre</Link>
  </header>
  <nav aria-label="Filtrer le catalogue" className="flex flex-wrap gap-2">
   {tabs.map(tab=><Link key={tab.key} href={makeHref(tab.key)} aria-current={selected===tab.key?"page":undefined}
    className={`rounded-sm border px-3 py-2 text-xs font-bold ${selected===tab.key?"border-night-900 bg-night-900 text-white":"border-rule-strong bg-white text-night-900 hover:border-night-900"}`}>
    {tab.label}{tab.key==="submitted"&&!pending.error?` (${pending.count??0})`:""}
   </Link>)}
  </nav>
  <form method="get" action="/dashboard/admin/books" className="flex flex-wrap items-end gap-3 rounded-md border border-rule-strong bg-white p-4">
   <input type="hidden" name="filter" value={selected}/>
   <label className="min-w-[190px] flex-1 text-xs font-bold text-slate-700">Rechercher un titre ou un auteur
    <input name="q" defaultValue={query} placeholder="Titre ou auteur…" className="mt-2 block h-11 w-full rounded-md border border-rule-strong px-3 text-sm font-normal"/>
   </label>
   <button type="submit" className="h-11 rounded-sm bg-night-900 px-5 text-sm font-bold text-white">Rechercher</button>
   <Link href={makeHref(selected)} className="px-2 py-3 text-xs font-semibold text-slate-600">Réinitialiser</Link>
  </form>
  <BulkPublishForm eligibleCount={eligibleCount}/>
  {error?<p role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">Impossible de charger les livres : {error.message}</p>:null}
  <div className="flex items-center justify-between gap-3">
   <p className="text-sm font-semibold text-night-900">{error?"—":total} livres · Page {currentPage} / {lastPage}</p>
   {selected==="submitted"?<p className="text-xs font-medium text-amber-800">En attente de décision de l’équipe éditoriale</p>:null}
  </div>
  <div className="overflow-x-auto rounded-md border border-rule-strong bg-white">
   <table className="w-full min-w-[880px] text-left text-sm">
    <thead className="bg-paper-deep text-xs uppercase tracking-wide text-slate-600">
     <tr><th className="w-10 p-4"><span className="sr-only">Sélection</span></th><th className="p-4">Couverture</th><th className="p-4">Livre</th><th className="p-4">Révision</th><th className="p-4">Publication</th><th className="p-4">Droits</th><th className="p-4">Prix</th><th className="p-4">Décision</th></tr>
    </thead>
    <tbody>{items.map(book=><tr key={book.id} className="border-t border-rule align-middle">
      <td className="p-3 text-center">{book.quickPublish?<input type="checkbox" name="bulk" value={book.id} form={BULK_FORM_ID} aria-label={`Sélectionner « ${book.title} » pour publication groupée`} className="h-5 w-5"/>:null}</td>
      <td className="p-3"><div className="flex h-20 w-14 items-center justify-center overflow-hidden rounded-sm border border-rule bg-paper">
       {book.cover?<Image src={book.cover} alt={`Couverture du livre ${book.title}`} width={80} height={112} className="h-full w-full object-cover" unoptimized/>:<span className="px-1 text-center text-[10px] text-slate-500">Image indisponible</span>}
      </div></td>
      <td className="max-w-[330px] p-4"><Link className="font-bold text-night-900 hover:text-brand-600" href={`/dashboard/admin/books/${book.id}`}>{book.title}</Link>
       <p className="mt-1 text-xs text-slate-500">{book.author_display_name??"Auteur non indiqué"}</p></td>
      <td className="p-4"><span className={`rounded-sm px-2 py-1 text-xs font-bold ${reviewColors[book.review_status]??"bg-paper text-night-900"}`}>{book.review_status}</span></td>
      <td className="p-4 text-xs font-medium">{book.status}</td>
      <td className="p-4 text-xs">{book.copyright_status}</td>
      <td className="p-4 tabular-nums">{book.price} {book.currency_code}</td>
      <td className="p-4"><Link href={`/dashboard/admin/books/${book.id}`} className="inline-flex rounded-sm bg-night-900 px-3 py-2 text-xs font-bold text-white">
       {book.quickPublish?"Valider et publier":book.review_status==="submitted"?"Examiner":"Gérer"}
      </Link></td>
     </tr>)}</tbody>
   </table>
   {!items.length&&!error?<p className="p-6 text-sm text-slate-500">{selected==="submitted"?"Aucun livre en attente de validation.":"Aucun livre ne correspond à ces critères."}</p>:null}
  </div>
  {lastPage>1?<nav className="flex items-center justify-end gap-3 text-sm" aria-label="Pagination des livres">
   {currentPage>1?<Link className="font-bold text-brand-700" href={makeHref(selected,currentPage-1)}>← Précédent</Link>:null}
   <span>{currentPage} / {lastPage}</span>
   {currentPage<lastPage?<Link className="font-bold text-brand-700" href={makeHref(selected,currentPage+1)}>Suivant →</Link>:null}
  </nav>:null}
 </section>;
}
