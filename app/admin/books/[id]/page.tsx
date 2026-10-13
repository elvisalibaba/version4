import Image from "next/image";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { getBookCoverUrl } from "@/lib/supabase/book-covers";
import { SupabaseBookEditor } from "@/components/supabase/book-editor";
import { BookWorkflowControls } from "@/components/admin/book-workflow-controls";
import Link from "next/link";

export const dynamic="force-dynamic";
export default async function EditSupabaseBook({params}:{params:Promise<{id:string}>}){
 await requireAdmin();const {id}=await params;
 const db=await createClient();
 const {data:book,error}=await db.from("books").select("id,title,subtitle,description,author_display_name,publisher,isbn,language,price,categories,tags,cover_url,cover_thumbnail_url,file_url,status,review_status,copyright_status,review_note").eq("id",id).maybeSingle();
 if(error||!book)notFound();
 const [cover,events]=await Promise.all([
  getBookCoverUrl(db,book.cover_thumbnail_url||book.cover_url),
  db.from("book_editorial_events").select("id,event_type,notes,created_at").eq("book_id",id).order("created_at",{ascending:false}).limit(10)
 ]);
 return <div className="space-y-6">
  <Link href={book.review_status==="submitted"?"/dashboard/admin/books?filter=submitted":"/dashboard/admin/books"} className="inline-flex text-sm font-bold text-brand-600">← Retour au catalogue</Link>
  <div className="grid gap-5 rounded-md border border-rule-strong bg-white p-5 sm:grid-cols-[145px_minmax(0,1fr)] sm:p-6">
   <div className="flex h-52 w-36 items-center justify-center overflow-hidden rounded-md border border-rule-strong bg-paper">
    {cover?<Image src={cover} alt={`Couverture : ${book.title}`} width={160} height={224} className="h-full w-full object-cover" unoptimized/>:<span className="px-3 text-center text-xs text-slate-500">Couverture indisponible</span>}
   </div>
   <div><p className="text-xs font-bold uppercase tracking-widest text-brand-600">Fiche éditoriale</p>
    <h1 className="mt-2 text-2xl font-black text-night-900 sm:text-3xl">{book.title}</h1>
    <p className="mt-2 text-sm text-slate-600">{book.author_display_name??"Sans auteur identifié"}</p>
    <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
     <span className="rounded-sm bg-paper-deep px-3 py-2">Révision : {book.review_status}</span>
     <span className="rounded-sm bg-paper-deep px-3 py-2">Publication : {book.status}</span>
     <span className="rounded-sm bg-paper-deep px-3 py-2">Droits : {book.copyright_status}</span>
    </div>
    {book.review_note?<p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Dernier commentaire : {book.review_note}</p>:null}
   </div>
  </div>
  <BookWorkflowControls book={{id:book.id,status:book.status,review_status:book.review_status,copyright_status:book.copyright_status,cover_url:book.cover_url,file_url:book.file_url}}/>
  <section className="space-y-4">
   <h2 className="text-xl font-black text-night-900">Métadonnées et fichiers</h2>
   <SupabaseBookEditor book={book} area="admin"/>
  </section>
  <section className="rounded-md border border-rule-strong bg-white p-5">
   <h2 className="text-lg font-bold">Historique des décisions</h2>
   {events.error?<p className="mt-3 text-sm text-red-700">Historique temporairement indisponible.</p>:
   <div className="mt-3 divide-y divide-rule">
    {(events.data??[]).map(event=><div key={event.id} className="py-3">
     <div className="flex flex-wrap items-center justify-between gap-2">
      <strong className="text-sm">{event.event_type}</strong>
      <time className="text-xs text-slate-500">{new Date(event.created_at).toLocaleString("fr-FR")}</time>
     </div>
     {event.notes?<p className="mt-1 text-sm text-slate-600">{event.notes}</p>:null}
    </div>)}
    {!events.data?.length?<p className="py-4 text-sm text-slate-500">Aucune décision enregistrée dans le nouvel historique.</p>:null}
   </div>}
  </section>
 </div>;
}
