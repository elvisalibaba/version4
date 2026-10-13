import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/supabase/config";

/** Request-scoped client. Never use a service-role key for browser sessions. */
export async function createClient() {
  const { url, key } = getSupabaseConfig();
  const jar = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() { return jar.getAll(); },
      setAll(changes) {
        try {
          changes.forEach(({ name, value, options }) => jar.set(name, value, options));
        } catch {
          // Server Components cannot set cookies; proxy.ts refreshes the session.
        }
      },
    },
  });
}
