import "server-only";
import { createClient } from "@/lib/supabase/server";
import { stableCoverUrl, type CoverSource } from "@/lib/covers";

/**
 * URL d'affichage d'une couverture. Bucket public « covers » : URL stable, aucun appel réseau.
 * Ancien emplacement (bucket privé « books », transition) : URL signée 1 h, sous la session du visiteur.
 */
export async function getBookCoverUrl(
  client: Awaited<ReturnType<typeof createClient>>,
  book: CoverSource,
  preferThumbnail = false,
): Promise<string | null> {
  const stable = stableCoverUrl(book, preferThumbnail);
  if (stable) return stable;
  const path = (preferThumbnail ? book.cover_thumbnail_url || book.cover_url : book.cover_url) ?? null;
  if (!path || book.cover_bucket === "covers" || !path.startsWith("covers/")) return null;
  const { data, error } = await client.storage.from("books").createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data?.signedUrl ?? null;
}
