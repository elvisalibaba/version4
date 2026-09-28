import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiClient } from "@/lib/api/client";
import { AUTH_COOKIE_NAME } from "@/lib/api/session";

export async function POST() {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE_NAME)?.value ?? null;
  if (token) {
    await apiClient("auth/logout", { method: "POST", token }).catch(() => undefined);
  }
  store.delete(AUTH_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
