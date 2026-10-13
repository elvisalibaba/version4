import { NextResponse } from "next/server";
import { getSupabaseUser } from "@/lib/supabase/user";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseMode } from "@/lib/data-source";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ACTIONS=new Set(["approve","request_changes","reject","publish","coming_soon","unpublish","archive","reset_draft","rights_clear","rights_review","rights_block"]);

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 if(!isSupabaseMode())return NextResponse.json({message:"Opération indisponible."},{status:404});
 const origin=request.headers.get("origin");
 if(origin && origin!==new URL(request.url).origin)return NextResponse.json({message:"Origine non autorisée."},{status:403});
 const {id}=await params;
 if(!UUID.test(id))return NextResponse.json({message:"Identifiant invalide."},{status:422});
 const user=await getSupabaseUser();
 if(!user||user.profile.role!=="admin")return NextResponse.json({message:"Accès réservé aux administrateurs."},{status:403});
 let payload:unknown;
 try{payload=await request.json();}catch{return NextResponse.json({message:"Requête invalide."},{status:400});}
 const input=payload&&typeof payload==="object"?payload as Record<string,unknown>:{};
 if(typeof input.action!=="string"||!ACTIONS.has(input.action)){
  return NextResponse.json({message:"Action non reconnue."},{status:422});
 }
 if(input.note!==undefined && typeof input.note!=="string")return NextResponse.json({message:"Commentaire invalide."},{status:422});
 const note=typeof input.note==="string"?input.note.trim().slice(0,2000):"";
 const client=await createClient();
 const {data,error}=await client.rpc("hb_admin_transition_book",{
  p_book_id:id,p_action:input.action,p_note:note||null,
 });
 if(error){
  const forbidden=error.code==="42501";
  return NextResponse.json({message:forbidden?"Accès refusé.":error.message},{status:forbidden?403:422});
 }
 return NextResponse.json({ok:true,book:data},{headers:{"Cache-Control":"no-store"}});
}
