import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabasePublicRuntimeConfig } from "@/lib/supabase/runtime-config";

export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabasePublicRuntimeConfig();

  return createServerClient<Database>(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Ignored in Server Components; proxy refreshes cookies.
          }
        },
      },
    },
  );
}
