import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
export const dynamic="force-dynamic";
const UUID=/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
const fallback=()=>NextResponse.redirect(new URL("/pwa-icon-512.png","https://www.holistique-books.com"),307);
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!UUID.test(id))return fallback();
 const db=await createClient();
 const {data:book,error}=await db.from("books").select("cover_thumbnail_url,cover_url,status,review_status,copyright_status").eq("id",id).maybeSingle();
 if(error||!book||book.status!=="published"||book.review_status!=="approved"||book.copyright_status==="blocked")return fallback();
 const path=book.cover_thumbnail_url??book.cover_url;
 if(!path||!path.startsWith("covers/")||path.includes(".."))return fallback();
 const {data,error:signedError}=await db.storage.from("books").createSignedUrl(path,120);
 if(signedError||!data?.signedUrl)return fallback();
 try{
  const response=await fetch(data.signedUrl,{cache:"no-store",signal:AbortSignal.timeout(8000)});
  const type=response.headers.get("content-type")??"";
  if(!response.ok||!/^image\/(jpeg|png|webp)$/i.test(type))return fallback();
  const bytes=await response.arrayBuffer();
  if(bytes.byteLength>8*1024*1024)return fallback();
  return new NextResponse(bytes,{headers:{"Content-Type":type,"Cache-Control":"public, s-maxage=300, stale-while-revalidate=600","X-Content-Type-Options":"nosniff"}});
 }catch{return fallback()}
}
