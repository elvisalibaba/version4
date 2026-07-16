import { getSupabasePublicRuntimeConfig } from "@/lib/supabase/runtime-config";

const NETWORK_ERROR_FRAGMENTS = [
  "failed to fetch",
  "load failed",
  "networkerror",
  "network request failed",
  "fetch failed",
];

function extractErrorMessage(error: unknown): string | null {
  if (typeof error === "string") {
    return error.trim() || null;
  }

  if (error instanceof Error) {
    return error.message.trim() || null;
  }

  if (typeof error === "object" && error !== null) {
    const message = "message" in error ? error.message : null;
    return typeof message === "string" && message.trim().length > 0 ? message.trim() : null;
  }

  return null;
}

function isNetworkLikeErrorMessage(message: string | null) {
  if (!message) return false;

  const normalized = message.toLowerCase();
  return NETWORK_ERROR_FRAGMENTS.some((fragment) => normalized.includes(fragment));
}

export function getSupabaseBrowserConfigErrorMessage() {
  const { isFallback } = getSupabasePublicRuntimeConfig();

  if (!isFallback) {
    return null;
  }

  return "Configuration Supabase publique invalide. En local, verifie .env.local. En ligne, configure NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans les variables d environnement du deploiement, puis redeploie.";
}

export function getSupabaseBrowserErrorMessage(error: unknown, actionLabel: string) {
  const configError = getSupabaseBrowserConfigErrorMessage();
  if (configError) {
    return configError;
  }

  const message = extractErrorMessage(error);
  if (isNetworkLikeErrorMessage(message)) {
    return `Connexion a Supabase impossible pendant ${actionLabel}. Verifie l acces internet, l URL de ton projet Supabase et redemarre Next si .env.local a change.`;
  }

  return message ?? `${actionLabel} impossible. Reessaie dans un instant.`;
}
