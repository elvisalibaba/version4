import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiClient } from "@/lib/api/client";
import { AUTH_COOKIE_NAME } from "@/lib/api/session";

export async function POST() {
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE_NAME)?.value;
  if (token) await apiClient("auth/logout", { method: "POST", token }).catch(() => undefined);
  jar.delete(AUTH_COOKIE_NAME);
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
