import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

function getServiceRoleConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const missing: string[] = [];

  if (!url) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!serviceRoleKey) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }

  if (missing.length > 0) {
    throw new Error(
      `Supabase server configuration is incomplete. Missing: ${missing.join(
        ", ",
      )}. Add these variables to .env.local to enable order creation and Mobile Money payments via CinetPay.`,
    );
  }

  return {
    url: url!,
    serviceRoleKey: serviceRoleKey!,
  };
}

export function createServiceRoleClient() {
  const { url, serviceRoleKey } = getServiceRoleConfig();

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
