import { NextResponse } from "next/server";
import { isSupabaseMode } from "@/lib/data-source";
import { createClient } from "@/lib/supabase/server";
import { apiClient,ApiError } from "@/lib/api/client";
export async function POST(request:Request){const body=await request.json();
 if(isSupabaseMode()){const client=await createClient();const origin=new URL(request.url).origin;await client.auth.resetPasswordForEmail(body.email,{redirectTo:`${origin}/auth/callback?next=/reset-password`});return NextResponse.json({message:"Si ce compte existe, un courriel a été envoyé."});}
 try{return NextResponse.json(await apiClient("auth/forgot-password",{method:"POST",body}));}
 catch(error){if(error instanceof ApiError)return NextResponse.json(error.payload??{message:"Demande impossible."},{status:error.status});return NextResponse.json({message:"Service indisponible."},{status:503});}}
