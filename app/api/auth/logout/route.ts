import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isSupabaseMode } from "@/lib/data-source";
import { createClient } from "@/lib/supabase/server";
import { apiClient } from "@/lib/api/client";
import { AUTH_COOKIE_NAME } from "@/lib/api/session";
export async function POST() {
 if(isSupabaseMode()){const client=await createClient();await client.auth.signOut();return NextResponse.json({ok:true});}
 const jar=await cookies();const token=jar.get(AUTH_COOKIE_NAME)?.value;
 if(token)await apiClient("auth/logout",{method:"POST",token}).catch(()=>undefined);
 jar.delete(AUTH_COOKIE_NAME);return NextResponse.json({ok:true});
}
