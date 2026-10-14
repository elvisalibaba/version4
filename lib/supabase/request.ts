import "server-only";
import { createClient as createSupabaseClient, type User } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient as createCookieClient } from "@/lib/supabase/server";

function bearerToken(request: Request) {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  const match = /^Bearer\s+([^\s]+)$/i.exec(authorization);
  return {
    attempted: authorization.toLowerCase().startsWith("bearer"),
    token: match?.[1] ?? null,
  };
}

/** Resolves either a native mobile Bearer session or the existing web cookie session. */
export async function getSupabaseRequestAuth(request: Request): Promise<{
  user: User | null;
  accessToken: string | null;
  bearerAttempted: boolean;
  error: string | null;
}> {
  const bearer = bearerToken(request);

  if (bearer.attempted) {
    if (!bearer.token) {
      return { user: null, accessToken: null, bearerAttempted: true, error: "Jeton Bearer invalide." };
    }

    const { url, key } = getSupabaseConfig();
    const client = createSupabaseClient(url, key, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
      global: { headers: { Authorization: `Bearer ${bearer.token}` } },
    });
    const { data, error } = await client.auth.getUser(bearer.token);
    return {
      user: error ? null : data.user,
      accessToken: error ? null : bearer.token,
      bearerAttempted: true,
      error: error?.message ?? null,
    };
  }

  const client = await createCookieClient();
  const { data: userData, error } = await client.auth.getUser();
  if (error || !userData.user) {
    return {
      user: null,
      accessToken: null,
      bearerAttempted: false,
      error: error?.message ?? null,
    };
  }
  const { data: sessionData } = await client.auth.getSession();
  return {
    user: userData.user,
    accessToken: sessionData.session?.access_token ?? null,
    bearerAttempted: false,
    error: null,
  };
}
