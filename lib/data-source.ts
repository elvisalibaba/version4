/** Compatibility guard: the web frontend always uses the Laravel API. */
export function isSupabaseMode(): boolean {
  return false;
}
