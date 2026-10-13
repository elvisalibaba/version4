import { NextResponse, type NextRequest } from "next/server";
import { getSafeNextPath } from "@/lib/safe-next-path";
import { isSupabaseMode } from "@/lib/data-source";
import { createClient } from "@/lib/supabase/server";
export async function GET(request:NextRequest){
 const next=getSafeNextPath(request.nextUrl.searchParams.get("next"));
 if(isSupabaseMode()){
   const code=request.nextUrl.searchParams.get("code");
   if(code){const client=await createClient();const {error}=await client.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL(next,request.url));}
   const url=new URL("/login",request.url);url.searchParams.set("auth","error");return NextResponse.redirect(url);
 }
 const url=new URL("/login",request.url);url.searchParams.set("next",next);url.searchParams.set("auth","laravel");return NextResponse.redirect(url);
}
