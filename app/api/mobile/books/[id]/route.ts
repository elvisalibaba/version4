import { NextResponse } from "next/server";
import { apiClient, ApiError } from "@/lib/api/client";
import type { ApiBook } from "@/types/api";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!UUID.test(id)) return NextResponse.json({ message: "Identifiant invalide." }, { status: 422 });
  try {
    const result = await apiClient<{ data: ApiBook }>(`books/${encodeURIComponent(id)}`, { cache: "no-store" });
    return NextResponse.json({ data: { ...result.data, is_favorite: false } }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json(error.payload ?? { message: "Livre introuvable." }, { status: error.status });
    return NextResponse.json({ message: "Livre indisponible." }, { status: 503 });
  }
}
