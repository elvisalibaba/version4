import { NextResponse } from "next/server";
import { isSupabaseMode } from "@/lib/data-source";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { getSupabaseRequestAuth } from "@/lib/supabase/request";
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
 if(isSupabaseMode()){
  const auth=await getSupabaseRequestAuth(request);
  if(auth.bearerAttempted&&auth.error)return NextResponse.json({error:"Session mobile invalide ou expirée."},{status:401});
  const user=auth.user;
  if(!user&&page>10)return NextResponse.json({error:"Créez un compte pour lire la suite.",code:"LOGIN_REQUIRED"},{status:401});
  const {url:base,key}=getSupabaseConfig();
  let upstream:Response;
  try{
   upstream=await fetch(base+"/functions/v1/holistic-reader-page?"+new URLSearchParams({bookId,page:String(page)}),{
    headers:{"apikey":key,...(user&&auth.accessToken?{"Authorization":"Bearer "+auth.accessToken}:{})},
    cache:"no-store",
   });
  }catch{return NextResponse.json({error:"Service lecteur momentanément indisponible."},{status:503});}
  const contentType=upstream.headers.get("content-type")??"application/json";
  if(!upstream.ok){
   const payload=await upstream.json().catch(()=>({error:"Lecture impossible."}));
   return NextResponse.json(payload,{status:upstream.status,headers:{"Cache-Control":"private, no-store"}});
  }
  const headers=new Headers({"Content-Type":contentType,"Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff","Content-Disposition":"inline"});
  return new NextResponse(upstream.body,{status:200,headers});
 }
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
