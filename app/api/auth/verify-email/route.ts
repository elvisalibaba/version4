import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiClient, ApiError } from "@/lib/api/client";
import { AUTH_COOKIE_NAME, authCookieOptions } from "@/lib/api/session";
import type { ApiUser } from "@/types/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await apiClient<{ data: ApiUser; token: string; message: string }>("auth/verify-email", {
      method: "POST", body,
    });
    (await cookies()).set(AUTH_COOKIE_NAME, result.token, authCookieOptions);
    return NextResponse.json({ data: result.data, message: result.message }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json(error.payload ?? { message: "Vérification impossible." }, { status: error.status });
    return NextResponse.json({ message: "Le serveur Laravel est momentanément indisponible." }, { status: 503 });
  }
}
