import "server-only";
import { createClient } from "@/lib/supabase/server";
import { BOOK_PUBLIC_COLUMNS } from "@/lib/supabase/columns";
import type { ApiBook, ApiBookFormat } from "@/types/api";

type PublicBook = ApiBook & { cover_signed_url?: string | null };
const numeric = (v: unknown) => Number(v ?? 0) || 0;

export async function getSupabaseBooks(options: { searchQuery?:string; category?:string; status?: "published"|"coming_soon"; bookId?:string; education?:string; educationAudience?:"school"|"university"; page?:number; perPage?:number } = {}) {
  const supabase = await createClient();
  const status = options.status ?? "published";
  let query = supabase.from("books").select(BOOK_PUBLIC_COLUMNS, { count: "exact" }).eq("status",status).neq("copyright_status","blocked");
  if(options.bookId) query=query.eq("id", options.bookId);
  if(options.education){
    const {data: taxonomy, error:taxError}=await supabase.from("academic_taxonomies")
      .select("id,parent_id,slug,audience").eq("is_active",true);
    if(taxError)throw new Error(taxError.message);
    const root=taxonomy?.find(n=>n.slug===options.education && (!options.educationAudience || n.audience===options.educationAudience));
    if(!root)return {books:[] as PublicBook[],total:0,page:1,lastPage:1};
    const selected=new Set<string>([root.id]);
    let changed=true;
    while(changed){
      changed=false;
      for(const n of taxonomy??[])if(n.parent_id&&selected.has(n.parent_id)&&!selected.has(n.id)){selected.add(n.id);changed=true;}
    }
    const {data: mapped, error:mapError}=await supabase.from("book_academic_taxonomy")
      .select("book_id").in("academic_taxonomy_id",Array.from(selected));
    if(mapError)throw new Error(mapError.message);
    const bookIds=Array.from(new Set((mapped??[]).map(n=>n.book_id)));
    if(!bookIds.length)return {books:[] as PublicBook[],total:0,page:1,lastPage:1};
    query=query.in("id",bookIds);
  }
  if(options.category && options.category !== "all") query=query.contains("categories",[options.category]);
  if(options.searchQuery?.trim()){
    const term=options.searchQuery.replace(/[%_,]/g," ").trim();
    query=query.or(`title.ilike.%${term}%,subtitle.ilike.%${term}%,author_display_name.ilike.%${term}%`);
  }
  const page=Math.max(1,options.page??1),perPage=Math.min(100,options.perPage??24);
  const response=await query.order("published_at",{ascending:false,nullsFirst:false}).order("created_at",{ascending:false}).range((page-1)*perPage,page*perPage-1);
  if(response.error) throw new Error("Supabase catalogue: "+response.error.message);
  const rows=(response.data ?? []) as unknown as Array<Record<string,unknown>>;
  const ids=rows.map(row=>String(row.id));
  const formats=ids.length?await supabase.from("book_formats").select("id,book_id,format,price,currency_code,downloadable,is_published").in("book_id",ids):{data:[],error:null};
  if(formats.error)throw new Error("Formats: "+formats.error.message);
  const {data:{user}}=await supabase.auth.getUser();
  const favorites=user && ids.length?await supabase.from("book_favorites").select("book_id").eq("user_id",user.id).in("book_id",ids):{data:[],error:null};
  const favoriteIds=new Set((favorites.data??[]).map(x=>x.book_id));
  const books=await Promise.all(rows.map(async row=>{
    const bookFormats=(formats.data??[]).filter(f=>f.book_id===row.id).map(f=>({
      id:String(f.id),format:f.format as ApiBookFormat["format"],price:numeric(f.price),currency_code:String(f.currency_code??"USD"),
      downloadable:!!f.downloadable,is_published:!!f.is_published,
    }));
    const publishedFormats=bookFormats.filter(f=>f.is_published && (f.format==="ebook"||f.format==="holistique_store"));
    const price=numeric(publishedFormats[0]?.price??row.price);
    let cover=typeof row.cover_url==="string"?row.cover_url:null;
    if(cover && !/^https?:\/\//.test(cover)){const {data}=await supabase.storage.from("books").createSignedUrl(cover,3600);cover=data?.signedUrl??null;}
    const mapped={
      ...row,id:String(row.id),title:String(row.title??""),subtitle:row.subtitle??null,
      author_id:String(row.author_id??""),author_display_name:row.author_display_name??null,
      cover_url:cover,cover_signed_url:cover,cover_alt_text:row.cover_alt_text??null,
      price,currency_code:String(row.currency_code??"USD"),is_free:price<=0,
      purchases_count:numeric(row.purchases_count),rating_avg:row.rating_avg===null?null:numeric(row.rating_avg),
      ratings_count:numeric(row.ratings_count),is_single_sale_enabled:row.is_single_sale_enabled!==false,
      is_subscription_available:!!row.is_subscription_available,
      formats:bookFormats,author_name:String(row.author_display_name??"Auteur"),author_avatar_url:null,
      is_favorite:favoriteIds.has(String(row.id)),categories:Array.isArray(row.categories)?row.categories:[],
      tags:Array.isArray(row.tags)?row.tags:[],media_editions:[],subscription_plans:[],
      display_price_label:price<=0?"Gratuit":`${price} ${row.currency_code??"USD"}`,
    } as unknown as PublicBook;
    return mapped;
  }));
  return {books,total:response.count??books.length,page,lastPage:Math.max(1,Math.ceil((response.count??books.length)/perPage))};
}
export async function getSupabaseBookById(id:string):Promise<ApiBook|null>{
 const client=await createClient();
 const {data,error}=await client.from("books").select("id,status,copyright_status").eq("id",id).maybeSingle();
 if(error||!data||data.copyright_status==="blocked"||!["published","coming_soon"].includes(data.status))return null;
 const all=await getSupabaseBooks({status:data.status,bookId:id,perPage:1});
 return all.books.find(book=>book.id===id)??null;
}
