import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {isSupabaseMode} from "@/lib/data-source";
export const dynamic="force-dynamic";
const uuid=/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
type Ctx={params:Promise<{id:string}>};
async function authorize(request:Request,{params}:Ctx){
 const {id}=await params;if(!isSupabaseMode()||!uuid.test(id))return {error:NextResponse.json({message:"Avis introuvable"},{status:404})};
 const origin=request.headers.get("origin");if(origin&&origin!==new URL(request.url).origin)return {error:NextResponse.json({message:"Origine non autorisée"},{status:403})};
 const db=await createClient(),{data:{user}}=await db.auth.getUser();
 if(!user)return {error:NextResponse.json({message:"Connexion requise"},{status:401})};
 return {db,user,id};
}
export async function PUT(request:Request,context:Ctx){
 const c=await authorize(request,context);if(c.error)return c.error;
 if(!c.db||!c.user||!c.id)return NextResponse.json({message:"Accès refusé"},{status:403});
 let input:unknown;try{input=await request.json()}catch{return NextResponse.json({message:"Requête invalide"},{status:400})}
 const body=(input&&typeof input==="object"?input:{}) as Record<string,unknown>;
 const rating=Number(body.rating),comment=typeof body.text==="string"?body.text.trim():null;
 if(!Number.isInteger(rating)||rating<1||rating>5||(comment!==null&&comment.length>5000))return NextResponse.json({message:"Note invalide"},{status:422});
 const {data,error}=await c.db.from("ratings").update({rating,review_text:comment||null}).eq("id",c.id).eq("user_id",c.user.id).select("id").maybeSingle();
 if(error||!data)return NextResponse.json({message:error?.message??"Avis non modifiable"},{status:422});
 return NextResponse.json({ok:true});
}
export async function DELETE(request:Request,context:Ctx){
 const c=await authorize(request,context);if(c.error)return c.error;
 if(!c.db||!c.user||!c.id)return NextResponse.json({message:"Accès refusé"},{status:403});
 const {data,error}=await c.db.from("ratings").delete().eq("id",c.id).eq("user_id",c.user.id).select("id").maybeSingle();
 if(error||!data)return NextResponse.json({message:error?.message??"Avis introuvable"},{status:404});
 return NextResponse.json({ok:true});
}
