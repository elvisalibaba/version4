import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api/client";
import { getServerAuthToken } from "@/lib/api/server";
import { cookies } from "next/headers";
import { proxyForwardHeaders } from "@/lib/api/forwarded";

export const dynamic="force-dynamic";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function GET(request:Request,context:{params:Promise<{bookId:string}>}){
 const {bookId}=await context.params;
 const url=new URL(request.url);
 const raw=url.searchParams.get("page")??"";
 const page=Number(raw);
 if(!UUID.test(bookId)||!raw||!Number.isSafeInteger(page)||page<1||page>6000)
  return NextResponse.json({error:"Page invalide."},{status:422});
 const token=await getServerAuthToken();
 const cookieStore=await cookies();
 const readerToken=cookieStore.get("hb_reader_"+bookId)?.value??null;
 const apiBase=getApiBaseUrl();
 const endpoint=token&&readerToken?"read/"+encodeURIComponent(bookId)+"/pages/"+page:"books/"+encodeURIComponent(bookId)+"/preview/pages/"+page;
 const upstream=await fetch(apiBase+"/api/v1/"+endpoint,{
  headers:{"Accept":"image/jpeg","X-Holistique-Reader":"web",...proxyForwardHeaders(request),...(token?{"Authorization":"Bearer "+token}:{}),...(readerToken?{"X-Holistique-Reader-Token":readerToken}:{})},
  cache:"no-store",
 });
 if(!upstream.ok)return NextResponse.json(await upstream.json().catch(()=>({error:"Lecture impossible."})),{status:upstream.status});
 return new NextResponse(upstream.body,{status:200,headers:{"Content-Type":upstream.headers.get("content-type")??"image/jpeg","Cache-Control":"private, no-store","Content-Disposition":"inline","X-Content-Type-Options":"nosniff"}});
}
