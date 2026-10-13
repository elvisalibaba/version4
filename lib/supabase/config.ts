export function getSupabaseConfig() {
  // Production cutover uses an explicit project URL without replacing legacy global env entries.
  const url = (process.env.NEXT_PUBLIC_HOLISTIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL)?.trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim();
  if (!url || !/^https:\/\//.test(url) || !key) {
    throw new Error("Configuration Supabase absente : NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  }
  return { url: url.replace(/\/$/, ""), key };
}
