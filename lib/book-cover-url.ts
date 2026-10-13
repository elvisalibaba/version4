/** Public cover address stays stable while internal Supabase signed links expire. */
const BOOK_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isValidBookId(id: string): boolean {
  return BOOK_UUID.test(id);
}
export function publicBookCoverUrl(id: string): string | null {
  return isValidBookId(id) ? `/api/covers/${id}` : null;
}
