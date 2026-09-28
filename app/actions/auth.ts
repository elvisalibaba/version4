"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { AUTH_COOKIE_NAME } from "@/lib/api/session";

export async function signOutAction() {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE_NAME)?.value;
  if (token) {
    await apiClient("auth/logout", { method: "POST", token }).catch(() => undefined);
  }
  store.delete(AUTH_COOKIE_NAME);
  redirect("/login");
}
