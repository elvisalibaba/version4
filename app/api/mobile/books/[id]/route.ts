import { NextResponse } from "next/server";
import { getSupabaseBookById } from "@/lib/supabase/catalog";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!UUID.test(id)) {
    return NextResponse.json({ message: "Identifiant de livre invalide." }, { status: 422 });
  }

  try {
    const book = await getSupabaseBookById(id);
    if (!book) return NextResponse.json({ message: "Livre introuvable." }, { status: 404 });
    // Réponse mise en cache publiquement (CDN) : aucun champ propre au visiteur (favoris).
    return NextResponse.json({ data: { ...book, is_favorite: false } }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("[Mobile book]", error);
    return NextResponse.json({ message: "Livre momentanément indisponible." }, { status: 503 });
  }
}
