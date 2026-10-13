import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidBookId } from "@/lib/book-cover-url";

export const dynamic = "force-dynamic";
const FALLBACK = "/pwa-icon-512.png";

/**
 * Stable, public image endpoint for published covers only. Full book files remain
 * private. Supabase RLS decides whether the request may read each cover.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidBookId(id)) return NextResponse.json({ error: "Livre invalide." }, { status: 404 });

  const db = await createClient();
  const { data: book, error } = await db.from("books")
    .select("cover_url,cover_thumbnail_url,status,review_status,copyright_status")
    .eq("id", id).maybeSingle();
  if (error || !book || !["published", "coming_soon"].includes(book.status)
    || book.review_status !== "approved" || book.copyright_status === "blocked") {
    return NextResponse.redirect(new URL(FALLBACK, request.url), 307);
  }
  const paths = [book.cover_thumbnail_url, book.cover_url].filter(
    (value): value is string => typeof value === "string"
      && value.startsWith("covers/") && !value.includes("..")
  );
  for (const path of new Set(paths)) {
    try {
      const { data, error: signedError } = await db.storage.from("books").createSignedUrl(path, 120);
      if (signedError || !data?.signedUrl) continue;
      const res = await fetch(data.signedUrl, {
        cache: "no-store", signal: AbortSignal.timeout(9000),
      });
      if (!res.ok) continue;
      const contentType = res.headers.get("content-type")?.split(";")[0].trim() ?? "";
      if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(contentType)) continue;
      const bytes = await res.arrayBuffer();
      if (!bytes.byteLength || bytes.byteLength > 8 * 1024 * 1024) continue;
      return new NextResponse(bytes, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          "X-Content-Type-Options": "nosniff",
          "Content-Disposition": "inline",
        },
      });
    } catch {
      // A broken thumbnail must not hide an intact original cover.
    }
  }
  return NextResponse.redirect(new URL(FALLBACK, request.url), 307);
}
