import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ApiAuthorBook, ApiAuthorProfile } from "@/types/api";

export async function getLegacyAuthorProfile() {
 const c=await createClient();const {data:{user}}=await c.auth.getUser();
 if(!user)throw new Error("Authentification requise.");
 const {data,error}=await c.from("author_profiles").select("*").eq("id",user.id).maybeSingle();
 if(error||!data)throw new Error("Profil auteur indisponible.");
 return data as unknown as ApiAuthorProfile;
}
export async function getLegacyAuthorBooks(){
 const c=await createClient();const {data:{user}}=await c.auth.getUser();
 if(!user)throw new Error("Authentification requise.");
 const {data,error}=await c.from("books").select("*").eq("author_id",user.id).order("created_at",{ascending:false});
 if(error)throw new Error(error.message);
 return await Promise.all((data??[]).map(async row=>{
   let cover=typeof row.cover_url==="string"?row.cover_url:null;
   if(cover && !/^https?:\/\//.test(cover)){
     const {data:signed}=await c.storage.from("books").createSignedUrl(cover,3600);
     cover=signed?.signedUrl??null;
   }
   return {...row,is_free:Number(row.price??0)===0,formats:[],media_editions:[],subscription_plans:[],
     views_count:Number(row.views_count??0),clicks_count:Number(row.clicks_count??0),cover_url:cover};
 })) as unknown as ApiAuthorBook[];
}
