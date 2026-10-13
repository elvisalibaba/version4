import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Signed URLs are generated per request, using the viewer's own RLS-scoped session. */
export async function getBookCoverUrl(
  client: Awaited<ReturnType<typeof createClient>>,
  path: string | null | undefined,
): Promise<string | null> {
  if (!path) return null;
  if (/^https:\/\//i.test(path)) return path;
  if (!path.startsWith("covers/")) return null;
  const { data, error } = await client.storage.from("books").createSignedUrl(path, 60 * 30);
  if (error) return null;
  return data?.signedUrl ?? null;
}
