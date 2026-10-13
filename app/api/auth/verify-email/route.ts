import { NextResponse } from "next/server";
import { isSupabaseMode } from "@/lib/data-source";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseUser } from "@/lib/supabase/user";
import { cookies } from "next/headers";
import { apiClient, ApiError } from "@/lib/api/client";
import { AUTH_COOKIE_NAME, authCookieOptions } from "@/lib/api/session";
import type { ApiUser } from "@/types/api";
export async function POST(request:Request){
 const body=await request.json();
 if(isSupabaseMode()){
   const client=await createClient();const {error}=await client.auth.verifyOtp({email:body.email,token:body.code,type:"email"});
   if(error)return NextResponse.json({message:"Code de confirmation invalide ou expiré."},{status:422});
   return NextResponse.json({data:await getSupabaseUser(),message:"Email vérifié."});
 }
 try {const result=await apiClient<{data:ApiUser;token:string;message:string}>("auth/verify-email",{method:"POST",body});(await cookies()).set(AUTH_COOKIE_NAME,result.token,authCookieOptions);return NextResponse.json({data:result.data,message:result.message});}
 catch(error){if(error instanceof ApiError)return NextResponse.json(error.payload??{message:"Vérification impossible."},{status:error.status});return NextResponse.json({message:"Service indisponible."},{status:503});}
}
