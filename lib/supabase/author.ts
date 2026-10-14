import "server-only";
import { createClient } from "@/lib/supabase/server";
import { AUTHOR_PROFILE_PUBLIC_COLUMNS, BOOK_PUBLIC_COLUMNS, PGRST_FUNCTION_NOT_FOUND } from "@/lib/supabase/columns";
import { getBookCoverUrl } from "@/lib/supabase/book-covers";
import type { CoverSource } from "@/lib/covers";
import type { ApiAuthorBook, ApiAuthorProfile } from "@/types/api";

export async function getLegacyAuthorProfile() {
 const c=await createClient();const {data:{user}}=await c.auth.getUser();
 if(!user)throw new Error("Authentification requise.");
 const {data,error}=await c.from("author_profiles").select(AUTHOR_PROFILE_PUBLIC_COLUMNS).eq("id",user.id).maybeSingle();
 if(error||!data)throw new Error("Profil auteur indisponible.");
 // Téléphone et notes de droits : colonnes privées, lues par RPC (propriétaire ou admin).
 const privateFields=await c.rpc("hb_author_profile_private",{p_author_id:user.id});
 let extra:Record<string,unknown>={};
 if(!privateFields.error)extra=(privateFields.data as Record<string,unknown>[]|null)?.[0]??{};
 else if(privateFields.error.code===PGRST_FUNCTION_NOT_FOUND){
   // Avant la migration de sécurité, ces colonnes sont encore lisibles directement.
   const legacy=await c.from("author_profiles").select("phone,rights_notes,rights_status,reference_source_url").eq("id",user.id).maybeSingle();
   extra=(legacy.data as unknown as Record<string,unknown>|null)??{};
 }
 return {...(data as unknown as Record<string,unknown>),...extra} as unknown as ApiAuthorProfile;
}
export async function getLegacyAuthorBooks(){
 const c=await createClient();const {data:{user}}=await c.auth.getUser();
 if(!user)throw new Error("Authentification requise.");
 const {data,error}=await c.from("books").select(BOOK_PUBLIC_COLUMNS).eq("author_id",user.id).order("created_at",{ascending:false});
 if(error)throw new Error(error.message);
 return await Promise.all(((data??[]) as unknown as Record<string,unknown>[]).map(async row=>{
   const cover=await getBookCoverUrl(c,row as CoverSource);
   return {...row,is_free:Number(row.price??0)===0,formats:[],media_editions:[],subscription_plans:[],
     views_count:Number(row.views_count??0),clicks_count:Number(row.clicks_count??0),cover_url:cover};
 })) as unknown as ApiAuthorBook[];
}
