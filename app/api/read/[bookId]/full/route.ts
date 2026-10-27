import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api/client";
import { isSupabaseMode } from "@/lib/data-source";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * One upstream request for a freely readable book.
 * The backend validates publication, free price and reading rights on every request.
 */
export async function GET(_request: Request, context: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await context.params;
  if (!UUID.test(bookId)) {
    return NextResponse.json({ error: "Livre invalide." }, { status: 422 });
  }
  if (isSupabaseMode()) {
    return NextResponse.json({ error: "Ce mode de lecture est réservé au catalogue Laravel." }, { status: 404 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(
      `${getApiBaseUrl()}/api/v1/books/${encodeURIComponent(bookId)}/read-free`,
      { headers: { Accept: "application/pdf, application/epub+zip" }, cache: "no-store" },
    );
  } catch {
    return NextResponse.json({ error: "Le serveur de lecture est momentanément indisponible." }, { status: 503 });
  }

  if (!upstream.ok) {
    const payload = await upstream.json().catch(() => ({ message: "Lecture indisponible." }));
    return NextResponse.json({ error: payload.message ?? "Lecture indisponible." }, { status: upstream.status });
  }

  const mime = upstream.headers.get("content-type") ?? "";
  if (!mime.includes("application/pdf") && !mime.includes("application/epub+zip")) {
    return NextResponse.json({ error: "Format de lecture inattendu." }, { status: 502 });
  }

  const headers = new Headers({
    "Content-Type": mime,
    "Content-Disposition": "inline",
    "Cache-Control": "public, max-age=300, s-maxage=1800",
    "X-Content-Type-Options": "nosniff",
  });
  const length = upstream.headers.get("content-length");
  if (length) headers.set("Content-Length", length);

  return new NextResponse(upstream.body, { status: 200, headers });
}
