import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {isSupabaseMode} from "@/lib/data-source";
export const dynamic="force-dynamic";
const uuid=/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
type Ctx={params:Promise<{bookId:string}>};
const fail=(message:string,status:number)=>NextResponse.json({message},{status});
export async function GET(request:Request,{params}:Ctx){
 if(!isSupabaseMode())return fail("Indisponible",404);
 const {bookId}=await params;if(!uuid.test(bookId))return fail("Identifiant invalide",422);
 const db=await createClient(),url=new URL(request.url);
 const page=Math.max(1,Math.min(1000,parseInt(url.searchParams.get("page")??"1",10)||1));
 const limit=Math.max(1,Math.min(30,parseInt(url.searchParams.get("per_page")??"8",10)||8));
 const sorting=url.searchParams.get("sort")==="helpful"?"helpful_count":"created_at";
 const {data:{user}}=await db.auth.getUser();
 const [book,reviews,summary,own]=await Promise.all([
  db.from("books").select("id,author_id").eq("id",bookId).maybeSingle(),
  db.from("ratings").select("id,user_id,rating,review_text,helpful_count,created_at,updated_at",{count:"exact"}).eq("book_id",bookId).eq("is_hidden",false).order(sorting,{ascending:false}).range((page-1)*limit,page*limit-1),
  db.from("ratings").select("rating").eq("book_id",bookId).eq("is_hidden",false),
  user?db.from("ratings").select("id,user_id,rating,review_text,helpful_count,created_at,updated_at").eq("book_id",bookId).eq("user_id",user.id).maybeSingle():Promise.resolve({data:null,error:null}),
 ]);
 if(book.error||!book.data)return fail("Livre introuvable",404);
 if(reviews.error||summary.error||own.error)return fail("Lecture des avis indisponible",503);
 // Badge et droit de noter calculés en base ; avant la migration de sécurité, ces RPC
 // n'existent pas encore (PGRST202) : pas de badge, et seule la règle « pas son propre livre ».
 const [verified,canReview]=await Promise.all([
  db.rpc("hb_review_verified_purchasers",{p_book_id:bookId}),
  user?db.rpc("hb_can_review_book",{p_book_id:bookId}):Promise.resolve({data:false,error:null}),
 ]);
 const verifiedIds=new Set(((verified.error?[]:verified.data)??[]).map((row:{user_id:string})=>row.user_id));
 const toReview=(r:{id:string;user_id:string;rating:number;review_text:string|null;helpful_count:number;created_at:string;updated_at:string})=>({
  id:r.id,rating:Number(r.rating),text:r.review_text,helpful_count:r.helpful_count??0,verified_purchase:verifiedIds.has(r.user_id),
  is_mine:!!user&&r.user_id===user.id,author:{name:"Lecteur HolisticBooks"},created_at:r.created_at,updated_at:r.updated_at
 });
 const scores=summary.data??[],count=reviews.count??0;
 return NextResponse.json({data:(reviews.data??[]).map(toReview),current_user_review:own.data?toReview(own.data):null,
  can_review:!!user&&book.data.author_id!==user.id&&(canReview.error?.code==="PGRST202"||canReview.data===true),
  summary:{rating_avg:scores.length?scores.reduce((sum,r)=>sum+Number(r.rating),0)/scores.length:null,reviews_count:scores.length},
  meta:{current_page:page,last_page:Math.max(1,Math.ceil(count/limit)),per_page:limit,total:count}
 },{headers:{"Cache-Control":"no-store"}});
}
export async function POST(request:Request,{params}:Ctx){
 if(!isSupabaseMode())return fail("Indisponible",404);
 const {bookId}=await params;if(!uuid.test(bookId))return fail("Livre invalide",422);
 const origin=request.headers.get("origin");if(origin&&origin!==new URL(request.url).origin)return fail("Origine non autorisée",403);
 const db=await createClient(),{data:{user}}=await db.auth.getUser();
 if(!user)return fail("Connectez-vous pour donner votre avis",401);
 const {data:book}=await db.from("books").select("author_id,status").eq("id",bookId).maybeSingle();
 if(!book||book.status!=="published")return fail("Livre non publié",404);
 if(book.author_id===user.id)return fail("Un auteur ne peut pas noter son propre livre",403);
 const access=await db.rpc("hb_can_review_book",{p_book_id:bookId});
 if(access.error&&access.error.code!=="PGRST202")return fail("Vérification de l'accès impossible",503);
 if(!access.error&&access.data!==true)return fail("Achetez ce livre, abonnez-vous ou choisissez un livre gratuit pour donner votre avis",403);
 let input:unknown;try{input=await request.json()}catch{return fail("Requête invalide",400)}
 const body=(input&&typeof input==="object"?input:{}) as Record<string,unknown>;
 const rating=Number(body.rating),comment=typeof body.text==="string"?body.text.trim():null;
 if(!Number.isInteger(rating)||rating<1||rating>5||(comment!==null&&comment.length>5000))return fail("Note ou commentaire invalide",422);
 const {error}=await db.from("ratings").insert({book_id:bookId,user_id:user.id,rating,review_text:comment||null});
 if(error)return fail(error.code==="23505"?"Vous avez déjà publié un avis sur ce livre":error.message,422);
 return NextResponse.json({ok:true},{status:201});
}
