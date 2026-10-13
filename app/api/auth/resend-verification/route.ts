import { NextResponse } from "next/server";
import { isSupabaseMode } from "@/lib/data-source";
import { createClient } from "@/lib/supabase/server";
import { apiClient, ApiError } from "@/lib/api/client";
export async function POST(request:Request){const body=await request.json();
 if(isSupabaseMode()){const client=await createClient();const {error}=await client.auth.resend({type:"signup",email:body.email});return error?NextResponse.json({message:error.message},{status:400}):NextResponse.json({message:"Code envoyé."});}
 try{return NextResponse.json(await apiClient("auth/resend-verification",{method:"POST",body}));}
 catch(error){if(error instanceof ApiError)return NextResponse.json(error.payload??{message:"Renvoi impossible."},{status:error.status});return NextResponse.json({message:"Service indisponible."},{status:503});}}
