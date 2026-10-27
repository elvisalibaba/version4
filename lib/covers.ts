/** Cover URLs originate in the Laravel public API. */
export const COVER_TRANSFORMS_ENABLED = false;
export type CoverSource = { cover_url?: string | null; cover_thumbnail_url?: string | null };

export function stableCoverUrl(book: CoverSource, preferThumbnail = false): string | null {
  const url = preferThumbnail ? book.cover_thumbnail_url ?? book.cover_url : book.cover_url;
  return typeof url === "string" && /^https:\/\//i.test(url) ? url : null;
}
export function coverImageLoader({ src }: { src: string; width: number; quality?: number }): string {
  return src;
}
