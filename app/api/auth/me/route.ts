import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isSupabaseMode } from "@/lib/data-source";
import { getSupabaseUser } from "@/lib/supabase/user";
import { apiClient, ApiError } from "@/lib/api/client";
import { AUTH_COOKIE_NAME } from "@/lib/api/session";
import type { ApiUser } from "@/types/api";
export async function GET() {
 if(isSupabaseMode()) {const user=await getSupabaseUser();return NextResponse.json({data:user},{status:user?200:401});}
 const token=(await cookies()).get(AUTH_COOKIE_NAME)?.value;
 if(!token)return NextResponse.json({data:null},{status:401});
 try{return NextResponse.json(await apiClient<{data:ApiUser}>("auth/me",{token}));}
 catch(error){if(error instanceof ApiError)return NextResponse.json(error.payload??{data:null},{status:error.status});return NextResponse.json({data:null},{status:503});}
}
