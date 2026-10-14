import { requireAdmin } from "@/lib/auth/require-admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase/service";
export const dynamic="force-dynamic";
export default async function AdminAuthors(){
 await requireAdmin();
 // rights_status est une colonne privée : lecture serveur après contrôle du rôle admin.
 // types/database.ts ne connaît pas encore ces colonnes (types générés à régénérer).
 const c=createServiceRoleClient() as unknown as SupabaseClient;
 const {data,error}=await c.from("author_profiles").select("id,display_name,professional_headline,location,rights_status,catalog_origin").order("display_name").limit(100);
 return <section className="space-y-5"><h2 className="text-3xl font-bold">Auteurs</h2>
   <p className="text-sm text-slate-600">100 profils d&apos;auteurs enregistrés dans Supabase. Les références internationales n&apos;impliquent pas une autorisation de publication.</p>
   {error?<p className="text-red-700">{error.message}</p>:null}
   <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{(data??[]).map(author=><article key={author.id} className="rounded-md border border-rule bg-white p-5">
     <h3 className="text-lg font-bold">{author.display_name}</h3>
     <p className="mt-1 text-sm text-slate-600">{author.professional_headline??author.location??"Auteur"}</p>
     <p className="mt-3 text-xs text-slate-500">Droits : {author.rights_status??"À vérifier"} | Origine : {author.catalog_origin??"plateforme"}</p>
   </article>)}</div>
 </section>;
}
