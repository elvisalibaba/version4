/**
 * Couvertures publiques (bucket Supabase « covers ») : URL stables et cachables,
 * sans signature ni requête par livre. Utilisable côté serveur et navigateur.
 */
export const COVERS_BUCKET = "covers";

/**
 * Transformations d'image Supabase (/render/image/...). Testées le 14/10/2026 :
 * 403 FeatureNotEnabled (plan Pro requis). Les couvertures sont donc servies telles
 * quelles (`unoptimized`), déjà optimisées à la copie (WebP ≤ 1200 px, miniature 400 px),
 * sans passer par l'optimiseur Vercel (quota épuisé : 402). Passer à true après un passage en Pro.
 */
export const COVER_TRANSFORMS_ENABLED = false;

const OBJECT_PATH = "/storage/v1/object/public/covers/";
const RENDER_PATH = "/storage/v1/render/image/public/covers/";

function supabaseUrl(): string {
  return (process.env.NEXT_PUBLIC_HOLISTIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
    .trim()
    .replace(/\/$/, "");
}

/** URL publique d'une clé du bucket « covers » (équivalent de storage.from("covers").getPublicUrl). */
export function publicCoverUrl(key: string): string | null {
  const base = supabaseUrl();
  if (!base || !key || key.includes("..")) return null;
  return base + OBJECT_PATH + key.split("/").map(encodeURIComponent).join("/");
}

export type CoverSource = {
  cover_url?: string | null;
  cover_thumbnail_url?: string | null;
  cover_bucket?: string | null;
};

/** URL d'affichage quand la couverture est déjà publique ; null si elle exige une signature (ancien bucket). */
export function stableCoverUrl(book: CoverSource, preferThumbnail = false): string | null {
  const key = (preferThumbnail ? book.cover_thumbnail_url || book.cover_url : book.cover_url) ?? null;
  if (!key) return null;
  if (/^https:\/\//i.test(key)) return key;
  if (book.cover_bucket === COVERS_BUCKET) return publicCoverUrl(key);
  return null;
}

/** Loader next/image : redimensionnement par Supabase quand les transformations sont actives. */
export function coverImageLoader({ src, width, quality }: { src: string; width: number; quality?: number }): string {
  if (!COVER_TRANSFORMS_ENABLED || !src.includes(OBJECT_PATH)) return src;
  const url = new URL(src.replace(OBJECT_PATH, RENDER_PATH));
  url.searchParams.set("width", String(width));
  url.searchParams.set("quality", String(quality ?? 75));
  url.searchParams.set("resize", "contain");
  return url.toString();
}
