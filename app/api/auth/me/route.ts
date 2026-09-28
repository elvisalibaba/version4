import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiClient, ApiError } from "@/lib/api/client";
import { AUTH_COOKIE_NAME } from "@/lib/api/session";
import type { ApiUser } from "@/types/api";

export async function GET() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ data: null }, { status: 401 });
  try {
    const data = await apiClient<{ data: ApiUser }>("auth/me", { token });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json(error.payload ?? { data: null }, { status: error.status });
    return NextResponse.json({ data: null }, { status: 503 });
  }
}
