import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseBooks } from "@/lib/supabase/catalog";
import type { ApiBook,ApiLibraryEntry,ApiOrder,ApiSubscription,ApiSubscriptionPlan } from "@/types/api";
async function currentId(){const client=await createClient();const {data:{user}}=await client.auth.getUser();if(!user)throw new Error("Connexion requise.");return {client,id:user.id};}
export async function getLegacyReaderLibrary():Promise<ApiLibraryEntry[]>{
 const {client,id}=await currentId();const {data,error}=await client.from("library").select("*").eq("user_id",id);
 if(error)throw new Error(error.message);
 const ids=(data??[]).map(row=>row.book_id);
 if(!ids.length)return [];
 const books=await Promise.all(ids.map(async bookId=>{const {data:b}=await client.from("books").select("*").eq("id",bookId).maybeSingle();return b;}));
 return (data??[]).flatMap((row,index)=>{const b=books[index];if(!b)return [];const book={...b,price:Number(b.price??0),is_free:Number(b.price??0)===0,formats:[],media_editions:[],subscription_plans:[],cover_url:/^https?:\/\//.test(b.cover_url??"")?b.cover_url:null} as unknown as ApiBook;
 return [{...row,book,reading_progress:null,purchased_at:row.purchased_at??row.created_at,expires_at:row.expires_at??null,last_opened_at:row.last_opened_at??null}] as ApiLibraryEntry[];});
}
export async function getLegacyReaderFavorites():Promise<ApiBook[]>{
 const {client,id}=await currentId();const {data,error}=await client.from("book_favorites").select("book_id").eq("user_id",id);
 if(error)throw new Error(error.message);const ids=new Set((data??[]).map(row=>row.book_id));
 const all=await getSupabaseBooks({perPage:100});return all.books.filter(book=>ids.has(book.id));
}
export async function getLegacyReaderOrders():Promise<ApiOrder[]>{
 const {client,id}=await currentId();const {data,error}=await client.from("orders").select("*").eq("user_id",id).order("created_at",{ascending:false});
 if(error)throw new Error(error.message);
 return (data??[]).map(row=>({...row,items:[]})) as unknown as ApiOrder[];
}
export async function getLegacyReaderSubscriptions():Promise<ApiSubscription[]>{
 const {client,id}=await currentId();const {data,error}=await client.from("user_subscriptions").select("*").eq("user_id",id);
 if(error)throw new Error(error.message);return (data??[]) as ApiSubscription[];
}
export async function getLegacyPlans():Promise<ApiSubscriptionPlan[]>{
 const client=await createClient();const {data,error}=await client.from("subscription_plans").select("*").eq("is_active",true);
 if(error)throw new Error(error.message);return (data??[]) as ApiSubscriptionPlan[];
}
