import { NextResponse } from "next/server";
import { isSupabaseMode } from "@/lib/data-source";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { ApiError } from "@/lib/api/client";
import { apiServer, getServerAuthToken } from "@/lib/api/server";
import type { ApiBook } from "@/types/api";

export const dynamic = "force-dynamic";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function GET(_request:Request, context:{params:Promise<{bookId:string}>}){
 const {bookId}=await context.params;
 if(!UUID.test(bookId))return NextResponse.json({error:"Livre invalide"},{status:422});
 if(isSupabaseMode()){
  const db=await createClient();
  const {data:{user}}=await db.auth.getUser();
  const {data:{session}}=user?await db.auth.getSession():{data:{session:null}};
  const {url,key}=getSupabaseConfig();
  let edge:Response;
  try{
   edge=await fetch(url+"/functions/v1/holistic-reader-page?"+new URLSearchParams({bookId,mode:"info"}),{
    headers:{"apikey":key,...(user&&session?.access_token?{"Authorization":"Bearer "+session.access_token}:{})},
    cache:"no-store",
   });
  }catch{return NextResponse.json({error:"Le service de lecture n'est pas joignable."},{status:503});}
  const meta=await edge.json().catch(()=>({error:"Réponse du lecteur invalide."}));
  if(!edge.ok)return NextResponse.json({error:meta.error??"Lecture indisponible"},{status:edge.status});
  const guest=!user;
  return NextResponse.json({
   readerUrl:"/api/read/"+encodeURIComponent(bookId)+"/file",
   fileType:meta.fileType,
   deliveryMode:meta.deliveryMode,
   pageCount:meta.pageCount,
   isGuestPreview:guest,
   previewPageLimit:guest?Math.min(10,meta.pageCount):null,
  },{headers:{"Cache-Control":"private, no-store"}});
 }
 try{
  const token=await getServerAuthToken();
  const {data:book}=await apiServer<{data:ApiBook&{file_format?:string|null}}>("books/"+encodeURIComponent(bookId),{authenticated:false});
  let guest=!token;
  let readerToken:string|null=null;
  if(token){
   try{
    const {data:access}=await apiServer<{data:{hasAccess:boolean;readerSession?:{token?:string|null}|null}}>("books/"+encodeURIComponent(bookId)+"/access");
    if(access.hasAccess)readerToken=access.readerSession?.token??null;
    else if(book.has_sample)guest=true;
    else return NextResponse.json({error:"Accès à ce livre refusé."},{status:403});
   }catch(error){
    if(error instanceof ApiError&&(error.status===401||error.status===403)&&book.has_sample)guest=true;
    else throw error;
   }
  }else if(!book.has_sample)return NextResponse.json({error:"Connectez-vous pour lire ce livre."},{status:401});
  if(book.file_format!=="pdf"&&!guest)return NextResponse.json({error:"Ce format n'est pas disponible dans le lecteur sécurisé."},{status:422});
  const limit=guest?Math.max(1,Math.min(10,Number(book.sample_pages??10))):null;
  const result=NextResponse.json({readerUrl:"/api/read/"+encodeURIComponent(bookId)+"/file",fileType:"pdf",deliveryMode:"page_images",pageCount:guest?limit:book.page_count??null,isGuestPreview:guest,previewPageLimit:limit});
  if(readerToken)result.cookies.set({name:"hb_reader_"+bookId,value:readerToken,httpOnly:true,sameSite:"strict",secure:process.env.NODE_ENV==="production",path:"/api/read/"+bookId,maxAge:600});
  return result;
 }catch(error){
  return NextResponse.json({error:error instanceof ApiError&&error.status===404?"Livre introuvable":"Lecture indisponible"},{status:503});
 }
}
