import { NextResponse } from "next/server";
import { isSupabaseMode } from "@/lib/data-source";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseUser } from "@/lib/supabase/user";
import { apiClient, ApiError } from "@/lib/api/client";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, authCookieOptions } from "@/lib/api/session";
import type { ApiUser } from "@/types/api";
export async function POST(request: Request) {
  if (isSupabaseMode()) {
    const { email, password } = await request.json();
    if (!email || !password) return NextResponse.json({ message: "Email et mot de passe requis." }, { status: 422 });
    const client = await createClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) return NextResponse.json({ message: "Identifiants invalides ou compte non confirmé." }, { status: 401 });
    const user = await getSupabaseUser();
    if (!user || !data.user) { await client.auth.signOut(); return NextResponse.json({ message: "Profil utilisateur indisponible." }, { status: 403 }); }
    return NextResponse.json({ data: user });
  }
  try {
    const body = await request.json();
    const result = await apiClient<{ data: ApiUser; token: string }>("auth/login", { method: "POST", body });
    (await cookies()).set(AUTH_COOKIE_NAME, result.token, authCookieOptions);
    return NextResponse.json({ data: result.data });
  } catch(error) {
    if (error instanceof ApiError) return NextResponse.json(error.payload ?? { message:"Connexion impossible." }, { status:error.status });
    return NextResponse.json({ message:"Service de connexion indisponible." }, { status:503 });
  }
}
