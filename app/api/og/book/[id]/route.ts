import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {stableCoverUrl} from "@/lib/covers";
export const dynamic="force-dynamic";
const UUID=/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
const fallback=()=>NextResponse.redirect(new URL("/pwa-icon-512.png","https://www.holistique-books.com"),307);
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!UUID.test(id))return fallback();
 const db=await createClient();
 const {data:book,error}=await db.from("books").select("cover_thumbnail_url,cover_url,cover_bucket,status,review_status,copyright_status").eq("id",id).maybeSingle();
 if(error||!book||book.status!=="published"||book.review_status!=="approved"||book.copyright_status==="blocked")return fallback();
 const paths=[book.cover_thumbnail_url,book.cover_url].filter((path):path is string=>typeof path==="string"&&path.startsWith("covers/")&&!path.includes(".."));
 try{
  // Bucket public « covers » : URL stable ; ancien bucket : URL signée 2 min.
  const sources=book.cover_bucket==="covers"
   ?[stableCoverUrl(book,true),stableCoverUrl(book)]
   :await Promise.all([...new Set(paths)].map(async path=>(await db.storage.from("books").createSignedUrl(path,120)).data?.signedUrl??null));
  for(const source of [...new Set(sources)]){
  if(!source)continue;
  const response=await fetch(source,{cache:"no-store",signal:AbortSignal.timeout(8000)});
  const type=response.headers.get("content-type")??"";
  if(!response.ok||!/^image\/(jpeg|png|webp)$/i.test(type))continue;
  const bytes=await response.arrayBuffer();
  if(bytes.byteLength>8*1024*1024)continue;
  return new NextResponse(bytes,{headers:{"Content-Type":type,"Cache-Control":"public, s-maxage=300, stale-while-revalidate=600","X-Content-Type-Options":"nosniff"}});
  }
  return fallback();
 }catch{return fallback()}
}
