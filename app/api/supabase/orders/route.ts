import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { isSupabaseMode } from "@/lib/data-source";
import { CHECKOUT_BOOK_FORMATS, isPhysicalBookFormat, type CheckoutBookFormat } from "@/lib/book-formats";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Line={book_id:string;book_format:CheckoutBookFormat;quantity:number};
function fail(message:string,status:number){return NextResponse.json({message},{status});}
export async function POST(request:Request){
 if(!isSupabaseMode())return fail("Route indisponible",404);
 const origin=request.headers.get("origin");
 if(origin&&origin!==new URL(request.url).origin)return fail("Origine non autorisée",403);
 const db=await createClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)return fail("Connectez-vous pour commander",401);
 let incoming:unknown;
 try{incoming=await request.json();}catch{return fail("Requête invalide",400);}
 const body=(incoming&&typeof incoming==="object"&&!Array.isArray(incoming)?incoming:{})as Record<string,unknown>;
 const currency=body.currency_code;
 if(currency!=="USD"&&currency!=="CDF")return fail("Devise non acceptée",422);
 if(!Array.isArray(body.items)||body.items.length<1||body.items.length>30)return fail("Le panier doit contenir de 1 à 30 lignes",422);
 const lines:Line[]=[];
 const unique=new Set<string>();
 for(const input of body.items as unknown[]){
  if(!input||typeof input!=="object"||Array.isArray(input))return fail("Article invalide",422);
  const item=input as Record<string,unknown>;
  const id=item.book_id,format=item.book_format,qty=Number(item.quantity);
  if(typeof id!=="string"||!UUID.test(id)||typeof format!=="string"
    ||!CHECKOUT_BOOK_FORMATS.includes(format as typeof CHECKOUT_BOOK_FORMATS[number])
    ||!Number.isSafeInteger(qty)||qty<1||qty>(isPhysicalBookFormat(format as typeof CHECKOUT_BOOK_FORMATS[number])?50:1))return fail("Livre, format ou quantité invalide",422);
  const key=id+":"+format;
  if(unique.has(key))return fail("Article en double",422);
  unique.add(key);lines.push({book_id:id,book_format:format as CheckoutBookFormat,quantity:qty});
 }
 const service=createServiceRoleClient();
 const ids=[...new Set(lines.map(l=>l.book_id))];
 const [booksResult,formatsResult,libraryResult]=await Promise.all([
  service.from("books").select("id,status,review_status,copyright_status,is_single_sale_enabled").in("id",ids),
  service.from("book_formats").select("book_id,format,price,currency_code,is_published").in("book_id",ids),
  service.from("library").select("book_id,access_type").eq("user_id",user.id).in("book_id",ids)
 ]);
 if(booksResult.error||formatsResult.error||libraryResult.error)return fail("Catalogue momentanément indisponible",503);
 const books=new Map((booksResult.data??[]).map(b=>[b.id,b]));
 const formats=new Map((formatsResult.data??[]).map(f=>[f.book_id+":"+f.format,f]));
 const owned=new Set((libraryResult.data??[]).filter(x=>x.access_type==="purchase").map(x=>x.book_id));
 const items:Array<{book_id:string;book_format:CheckoutBookFormat;price:number;currency_code:string;quantity:number}>=[];
 let total=0;
 for(const line of lines){
  const book=books.get(line.book_id),format=formats.get(line.book_id+":"+line.book_format);
  if(!book||book.status!=="published"||book.review_status!=="approved"||book.copyright_status!=="clear"
    ||!book.is_single_sale_enabled)return fail("Un livre n’est pas disponible à la vente",409);
  if(!format||!format.is_published||format.currency_code!==currency)return fail("Format ou devise non disponibles",409);
  if((line.book_format==="ebook"||line.book_format==="holistique_store")&&owned.has(line.book_id))
    return fail("Ce livre numérique figure déjà dans votre bibliothèque",409);
  const price=Number(format.price);
  if(!Number.isFinite(price)||price<=0)return fail("Ce format est gratuit : aucun paiement nécessaire",409);
  total+=price*line.quantity;
  items.push({book_id:line.book_id,book_format:line.book_format,price,currency_code:currency,quantity:line.quantity});
 }
 total=Math.round(total*100)/100;
 if(!(total>0)||total>10000000)return fail("Montant de commande invalide",422);
 const id=crypto.randomUUID();
 const {error:orderError}=await service.from("orders").insert({
  id,user_id:user.id,total_price:total,currency_code:currency,
  payment_status:"pending",payment_provider:"easypay",payment_provider_status:"ORDER_PREPARED",
  payment_metadata:{source:"supabase_cart_checkout",line_count:items.length}
 });
 if(orderError)return fail("Impossible de préparer la commande",503);
 const {error:itemsError}=await service.from("order_items").insert(items.map(x=>({...x,order_id:id})));
 if(itemsError){
  await service.from("orders").update({payment_status:"failed",payment_provider_status:"ORDER_ITEMS_FAILED"}).eq("id",id);
  return fail("Impossible d’ajouter les articles à la commande",503);
 }
 return NextResponse.json({data:{id,total_price:total,currency_code:currency}},{status:201,headers:{"Cache-Control":"no-store"}});
}
