import { createClient } from "npm:@supabase/supabase-js@2.98.0";
import { PDFDocument } from "npm:pdf-lib@1.17.1";
import { unzipSync, strFromU8 } from "npm:fflate@0.8.2";

const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const normalize=(path:string)=>{const out:string[]=[];for(const x of path.split("/")){if(x==="..")out.pop();else if(x&&x!==".")out.push(x);}return out.join("/")};
const entities=(s:string)=>s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi,(_,entity:string)=>{
 const e=entity.toLowerCase();
 if(e.startsWith("#")){const n=e.startsWith("#x")?parseInt(e.slice(2),16):parseInt(e.slice(1),10);return n>0&&n<=0x10ffff?String.fromCodePoint(n):""}
 const named:Record<string,string>={amp:"&",lt:"<",gt:">",quot:"\"",apos:"'",nbsp:" "};return named[e]??" ";
});
function epubPages(bytes:Uint8Array){
 const zip=unzipSync(bytes);
 const get=(path:string)=>zip[normalize(path)];
 const container=strFromU8(get("META-INF/container.xml")??new Uint8Array());
 const opf=container.match(/full-path\s*=\s*["']([^"']+)["']/i)?.[1];
 if(!opf)throw new Error("Manifeste EPUB introuvable");
 const opfText=strFromU8(get(opf)??new Uint8Array());
 const dir=opf.slice(0,opf.lastIndexOf("/")+1);
 const manifest=new Map<string,string>();
 for(const tag of opfText.match(/<item\s[^>]*>/gi)??[]){
  const id=tag.match(/\bid\s*=\s*["']([^"']+)["']/i)?.[1];
  const href=tag.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
  if(id&&href&&/\.x?html?(?:\?.*)?$/i.test(href))manifest.set(id,normalize(dir+decodeURIComponent(href.split("#")[0])));
 }
 const output:string[]=[];
 for(const tag of opfText.match(/<itemref\s[^>]*>/gi)??[]){
  const id=tag.match(/\bidref\s*=\s*["']([^"']+)["']/i)?.[1];
  const path=id?manifest.get(id):undefined;
  if(!path)continue;
  const bytes=get(path);if(!bytes)continue;
  let html=strFromU8(bytes);
  html=html.replace(/<(script|style|svg|head|nav)\b[^>]*>[\s\S]*?<\/\1\s*>/gi," ");
  html=html.replace(/<br\s*\/?\s*>/gi,"\n").replace(/<\/(?:p|div|li|h[1-6]|section|blockquote)>/gi,"\n\n");
  html=entities(html.replace(/<[^>]+>/g," ")).replace(/[ \t]+/g," ").replace(/\n\s*\n\s*\n+/g,"\n\n").trim();
  if(html)output.push(html);
 }
 let text=output.join("\n\n");
 if(text.length>10000000)throw new Error("Livre EPUB trop volumineux");
 if(!text)throw new Error("Livre EPUB vide");
 const pages:string[]=[];
 while(text.length){
  let limit=Math.min(2200,text.length);
  if(limit<text.length){const pos=text.lastIndexOf(" ",limit);if(pos>1600)limit=pos}
  pages.push(text.slice(0,limit).trim());text=text.slice(limit).trimStart();
  if(pages.length>6000)throw new Error("Livre EPUB trop long");
 }
 return pages;
}
export default {
 async fetch(req:Request):Promise<Response>{
  if(req.method!=="GET")return reply({error:"Méthode interdite"},405);
  const url=new URL(req.url);
  const id=url.searchParams.get("bookId")??"";
  const mode=url.searchParams.get("mode")==="info"?"info":"page";
  const page=Number(url.searchParams.get("page")??0);
  if(!uuid.test(id)||(mode==="page"&&(!Number.isSafeInteger(page)||page<1||page>6000)))return reply({error:"Paramètres invalides"},422);
  const supaUrl=Deno.env.get("SUPABASE_URL");
  const key=Deno.env.get("SUPABASE_ANON_KEY");
  const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!supaUrl||!key||!service)return reply({error:"Service indisponible"},503);
  const db=createClient(supaUrl,service,{auth:{autoRefreshToken:false,persistSession:false}});
  const auth=createClient(supaUrl,key,{auth:{autoRefreshToken:false,persistSession:false}});
  let userId:string|null=null;
  const token=req.headers.get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if(token&&token!==key){
   const {data:{user},error}=await auth.auth.getUser(token);
   if(!error&&user?.id)userId=user.id;
  }
  const {data:book,error}=await db.from("books").select("status,review_status,copyright_status,file_url,file_format,sample_pages").eq("id",id).maybeSingle();
  if(error||!book)return reply({error:"Livre introuvable"},404);
  if(book.status!=="published"||book.review_status!=="approved"||book.copyright_status!=="clear")return reply({error:"Livre non accessible"},403);
  // Droits évalués en base avec le JWT de l'utilisateur (jamais avec la clé service role).
  let hasAccess=false;
  if(userId&&token){
   const asUser=createClient(supaUrl,key,{auth:{autoRefreshToken:false,persistSession:false},global:{headers:{Authorization:"Bearer "+token}}});
   const {data:allowed,error:accessError}=await asUser.rpc("user_has_access_to_book",{p_user_id:userId,p_book_id:id});
   if(accessError)return reply({error:"Vérification des droits impossible"},503);
   hasAccess=allowed===true;
  }
  const samplePages=Number.isSafeInteger(book.sample_pages)&&book.sample_pages>0?Math.min(book.sample_pages,6000):10;
  if(mode==="page"&&!hasAccess&&page>samplePages){
   if(!userId)return reply({error:"Connexion requise après l'extrait gratuit",code:"LOGIN_REQUIRED"},401);
   return reply({error:"Achetez ce livre pour lire la suite",code:"ACCESS_REQUIRED"},403);
  }
  const path=book.file_url;
  if(typeof path!=="string"||!path.startsWith("files/")||path.includes("..")||/^https?:/i.test(path))return reply({error:"Fichier manquant"},422);
  const {data:file,error:downloadError}=await db.storage.from("books").download(path);
  if(downloadError||!file)return reply({error:"Fichier indisponible"},404);
  if(file.size>15*1024*1024)return reply({error:"Livre trop volumineux"},422);
  const bytes=new Uint8Array(await file.arrayBuffer());
  const format=book.file_format==="epub"||/\.epub$/i.test(path)?"epub":"pdf";
  try{
   if(format==="pdf"){
    const pdf=await PDFDocument.load(bytes,{ignoreEncryption:true,updateMetadata:false});
    const count=pdf.getPageCount();
    if(mode==="info")return reply({fileType:"pdf",pageCount:count,previewPageLimit:hasAccess?count:Math.min(samplePages,count),deliveryMode:"pdf_pages",hasFullAccess:hasAccess});
    if(page>count)return reply({error:"Page introuvable"},404);
    const single=await PDFDocument.create();
    const [selected]=await single.copyPages(pdf,[page-1]);single.addPage(selected);
    const content=await single.save({useObjectStreams:true});
    return new Response(new Uint8Array(content),{headers:{"Content-Type":"application/pdf","Content-Disposition":"inline; filename=page.pdf","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
   }
   const pages=epubPages(bytes);
   if(mode==="info")return reply({fileType:"epub",pageCount:pages.length,previewPageLimit:hasAccess?pages.length:Math.min(samplePages,pages.length),deliveryMode:"epub_pages",hasFullAccess:hasAccess});
   if(page>pages.length)return reply({error:"Page introuvable"},404);
   return reply({page,text:pages[page-1],pageCount:pages.length});
  }catch(err){return reply({error:err instanceof Error?err.message:"Format invalide"},422);}
 }
};
