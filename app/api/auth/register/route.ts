import { NextResponse } from "next/server";
import { isSupabaseMode } from "@/lib/data-source";
import { createClient } from "@/lib/supabase/server";
import { apiClient, ApiError } from "@/lib/api/client";
export async function POST(request: Request) {
  const body = await request.json();
  if (isSupabaseMode()) {
    const email = String(body.email ?? "").trim();
    const password = String(body.password ?? "");
    if (!email || password.length < 8 || password !== body.password_confirmation) return NextResponse.json({ message:"Email, mot de passe et confirmation valides requis." },{status:422});
    const firstName = String(body.first_name ?? "").trim();
    const lastName = String(body.last_name ?? "").trim();
    const allowedRole = body.role === "author" ? "author" : "reader";
    const client = await createClient();
    const { error } = await client.auth.signUp({ email, password, options: { data: {
      role: allowedRole, first_name:firstName,last_name:lastName,name:[firstName,lastName].filter(Boolean).join(" "),
      phone:body.phone, country:body.country,city:body.city, favorite_categories:body.favorite_categories,
      marketing_opt_in:body.marketing_opt_in,author_profile:body.author_profile,
      referred_by_affiliate_code:body.referred_by_affiliate_code,
      affiliate_source_type:body.affiliate_source_type,affiliate_source_book_id:body.affiliate_source_book_id,
      affiliate_source_plan_id:body.affiliate_source_plan_id,
    } } });
    if (error) return NextResponse.json({message:error.message},{status:400});
    return NextResponse.json({message:"Vérifiez votre adresse email.",verification_required:true,email},{status:201});
  }
  try {
    const data = await apiClient<{message:string;verification_required:boolean;email:string}>("auth/register",{method:"POST",body});
    return NextResponse.json(data,{status:201});
  } catch(error) {
    if(error instanceof ApiError)return NextResponse.json(error.payload??{message:"Inscription impossible."},{status:error.status});
    return NextResponse.json({message:"Service d'inscription indisponible."},{status:503});
  }
}
