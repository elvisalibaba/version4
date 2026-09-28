import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiClient, ApiError } from "@/lib/api/client";
import { AUTH_COOKIE_NAME, authCookieOptions } from "@/lib/api/session";
import type { ApiUser } from "@/types/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await apiClient<{ data: ApiUser; token: string }>("auth/login", { method: "POST", body });
    (await cookies()).set(AUTH_COOKIE_NAME, result.token, authCookieOptions);
    return NextResponse.json({ data: result.data });
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json(error.payload ?? { message: "Connexion impossible." }, { status: error.status });
    return NextResponse.json({ message: "Service de connexion indisponible." }, { status: 503 });
  }
}
