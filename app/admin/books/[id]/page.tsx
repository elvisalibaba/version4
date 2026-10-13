import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { SupabaseBookEditor } from "@/components/supabase/book-editor";

export default async function EditSupabaseBook({params}:{params:Promise<{id:string}>}){
 await requireAdmin();const {id}=await params;
 const c=await createClient();const {data,error}=await c.from("books").select("id,title,subtitle,description,author_display_name,publisher,isbn,language,price,categories,tags,cover_url,file_url,status,review_status,copyright_status").eq("id",id).maybeSingle();
 if(error||!data)notFound();
 return <section className="space-y-5">
  <div><h2 className="text-3xl font-bold">Modifier : {data.title}</h2>
   <p className="mt-2 text-sm text-slate-500">État : {data.status} | Vérification : {data.review_status} | Droits : {data.copyright_status}</p>
   <p className="mt-2 text-sm text-slate-600">Validation des droits et publication : module sécurisé à compléter. L'enregistrement n'accorde aucun droit au lecteur.</p></div>
  <SupabaseBookEditor book={data} area="admin"/>
 </section>;
}
