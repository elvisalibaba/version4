const FALLBACK_SUPABASE_URL = "http://127.0.0.1:54321";
const FALLBACK_SUPABASE_ANON_KEY = "missing-supabase-anon-key";

let hasLoggedMissingSupabasePublicConfig = false;

const PUBLIC_SUPABASE_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
} as const;

function readTrimmedEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
  const value = PUBLIC_SUPABASE_ENV[name];
  if (!value) return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeSupabaseUrl(value: string | null) {
  if (!value) return null;

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return parsed.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function getSupabasePublicRuntimeConfig() {
  const rawUrl = readTrimmedEnv("NEXT_PUBLIC_SUPABASE_URL");
  const url = normalizeSupabaseUrl(rawUrl);
  const anonKey = readTrimmedEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const missing: string[] = [];
  const invalid: string[] = [];

  if (!rawUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  else if (!url) invalid.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!anonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if ((missing.length > 0 || invalid.length > 0) && !hasLoggedMissingSupabasePublicConfig) {
    hasLoggedMissingSupabasePublicConfig = true;
    console.error(
      `[Supabase] Missing: ${missing.join(", ") || "none"}; invalid: ${invalid.join(", ") || "none"}. ` +
        "Falling back to a non-functional local client to avoid a hard crash. Configure valid values in Vercel project settings.",
    );
  }

  return {
    url: url ?? FALLBACK_SUPABASE_URL,
    anonKey: anonKey ?? FALLBACK_SUPABASE_ANON_KEY,
    isFallback: missing.length > 0 || invalid.length > 0,
  };
}
