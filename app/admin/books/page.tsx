import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";

export const dynamic="force-dynamic";
export default async function AdminBooksPage(){
 await requireAdmin();const c=await createClient();
 const {data,error}=await c.from("books").select("id,title,author_display_name,status,review_status,copyright_status,price,currency_code,created_at")
 .order("created_at",{ascending:false}).limit(100);
 return <section className="space-y-5">
   <div className="flex flex-wrap items-center justify-between gap-3">
     <div><h2 className="text-3xl font-bold">Catalogue</h2>
       <p className="mt-1 text-sm text-slate-500">100 derniers livres, gestion directe de Supabase</p></div>
     <Link href="/admin/books/new" className="rounded-sm bg-night-900 px-5 py-3 text-sm font-bold text-white">Nouveau livre</Link>
   </div>
   {error?<p role="alert" className="text-red-700">{error.message}</p>:null}
   <div className="overflow-x-auto rounded-md border border-rule bg-white">
     <table className="w-full min-w-[700px] text-left text-sm">
       <thead className="bg-paper-deep text-xs uppercase text-slate-600"><tr><th className="p-4">Livre</th><th className="p-4">Auteur</th><th className="p-4">Publication</th><th className="p-4">Droits</th><th className="p-4">Prix</th><th className="p-4">Action</th></tr></thead>
       <tbody>{(data??[]).map(book=><tr key={book.id} className="border-t border-rule">
        <td className="p-4 font-semibold">{book.title}</td>
        <td className="p-4">{book.author_display_name??"Non indiqué"}</td>
        <td className="p-4">{book.status} / {book.review_status}</td>
        <td className="p-4">{book.copyright_status}</td>
        <td className="p-4">{book.price} {book.currency_code}</td>
        <td className="p-4"><Link className="text-brand-600 underline" href={`/admin/books/${book.id}`}>Modifier</Link></td>
       </tr>)}</tbody>
     </table>
     {!data?.length?<p className="p-5 text-sm text-slate-500">Aucun livre enregistré.</p>:null}
   </div>
 </section>;
}
