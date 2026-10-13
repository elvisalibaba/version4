import { NextResponse } from "next/server";
import { isSupabaseMode } from "@/lib/data-source";
import { createClient } from "@/lib/supabase/server";
import { apiClient, ApiError } from "@/lib/api/client";
export async function POST(request:Request){const body=await request.json();
 if(isSupabaseMode()){if(!body.password||body.password!==body.password_confirmation)return NextResponse.json({message:"Confirmation invalide."},{status:422});const client=await createClient();const {error}=await client.auth.updateUser({password:body.password});return error?NextResponse.json({message:error.message},{status:400}):NextResponse.json({message:"Mot de passe mis à jour."});}
 try{return NextResponse.json(await apiClient("auth/reset-password",{method:"POST",body}));}
 catch(error){if(error instanceof ApiError)return NextResponse.json(error.payload??{message:"Réinitialisation impossible."},{status:error.status});return NextResponse.json({message:"Service indisponible."},{status:503});}}
