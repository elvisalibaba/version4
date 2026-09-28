import "server-only";

import { cookies } from "next/headers";
import { apiClient } from "@/lib/api/client";
import { AUTH_COOKIE_NAME } from "@/lib/api/session";

type ServerApiOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | Record<string, unknown> | null;
  authenticated?: boolean;
};

export async function apiServer<T>(path: string, options: ServerApiOptions = {}): Promise<T> {
  const token =
    options.authenticated === false
      ? null
      : (await cookies()).get(AUTH_COOKIE_NAME)?.value ?? null;

  return apiClient<T>(path, {
    ...options,
    token,
    cache: options.cache ?? "no-store",
  });
}

export async function getServerAuthToken() {
  return (await cookies()).get(AUTH_COOKIE_NAME)?.value ?? null;
}
