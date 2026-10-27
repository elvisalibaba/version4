import { NextResponse } from "next/server";
import { apiClient, ApiError } from "@/lib/api/client";
import type { ApiBook } from "@/types/api";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fallback = new URL("/pwa-icon-512.png", request.url);
  if (!UUID.test(id)) return NextResponse.redirect(fallback, 307);
  try {
    const { data } = await apiClient<{ data: ApiBook }>(`books/${encodeURIComponent(id)}`, { cache: "no-store" });
    if (data.status !== "published") return NextResponse.redirect(fallback, 307);
    const cover = data.cover_thumbnail_url ?? data.cover_url;
    if (cover && /^https:\/\//i.test(cover)) {
      return NextResponse.redirect(cover, 307);
    }
  } catch (error) {
    if (!(error instanceof ApiError)) console.warn("[Book cover] Laravel unavailable.");
  }
  return NextResponse.redirect(fallback, 307);
}
