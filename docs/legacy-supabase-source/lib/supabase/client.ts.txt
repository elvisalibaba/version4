import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabasePublicRuntimeConfig } from "@/lib/supabase/runtime-config";

export function createClient() {
  const { url, anonKey } = getSupabasePublicRuntimeConfig();

  return createBrowserClient<Database>(
    url,
    anonKey,
  );
}
