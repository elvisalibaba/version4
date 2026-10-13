import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {isSupabaseMode} from "@/lib/data-source";
export const dynamic="force-dynamic";
const uuid=/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
type Ctx={params:Promise<{bookId:string}>};
async function authorize(request:Request,{params}:Ctx){
 if(!isSupabaseMode())return {error:NextResponse.json({message:"Indisponible"},{status:404})};
 const {bookId}=await params;if(!uuid.test(bookId))return {error:NextResponse.json({message:"Livre invalide"},{status:422})};
 const origin=request.headers.get("origin");if(origin&&origin!==new URL(request.url).origin)return {error:NextResponse.json({message:"Origine non autorisée"},{status:403})};
 const db=await createClient(),{data:{user}}=await db.auth.getUser();
 if(!user)return {error:NextResponse.json({message:"Connectez-vous pour aimer ce livre"},{status:401})};
 return {db,user,bookId};
}
export async function POST(request:Request,context:Ctx){
 const c=await authorize(request,context);if(c.error)return c.error;
 if(!c.db||!c.user||!c.bookId)return NextResponse.json({message:"Accès refusé"},{status:403});
 const {error}=await c.db.from("book_favorites").upsert({book_id:c.bookId,user_id:c.user.id},{onConflict:"user_id,book_id",ignoreDuplicates:true});
 if(error)return NextResponse.json({message:error.message},{status:422});
 return NextResponse.json({ok:true,favorite:true});
}
export async function DELETE(request:Request,context:Ctx){
 const c=await authorize(request,context);if(c.error)return c.error;
 if(!c.db||!c.user||!c.bookId)return NextResponse.json({message:"Accès refusé"},{status:403});
 const {error}=await c.db.from("book_favorites").delete().eq("book_id",c.bookId).eq("user_id",c.user.id);
 if(error)return NextResponse.json({message:error.message},{status:422});
 return NextResponse.json({ok:true,favorite:false});
}
