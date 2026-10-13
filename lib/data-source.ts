/** Preview-only switch. Production remains Laravel unless explicitly configured. */
export function isSupabaseMode(): boolean {
  return process.env.HOLISTIC_DATA_SOURCE === "supabase";
}
