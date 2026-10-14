import { NextResponse } from "next/server";
import { getSupabaseBooks } from "@/lib/supabase/catalog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const requestedPage = Number(params.get("page") ?? 1);
  const requestedPerPage = Number(params.get("per_page") ?? 24);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const perPage = Number.isSafeInteger(requestedPerPage) && requestedPerPage > 0
    ? Math.min(requestedPerPage, 100)
    : 24;

  try {
    const result = await getSupabaseBooks({
      searchQuery: params.get("search") ?? undefined,
      category: params.get("category") ?? undefined,
      page,
      perPage,
    });
    // Réponse mise en cache publiquement (CDN) : aucun champ propre au visiteur (favoris).
    return NextResponse.json({
      data: result.books.map((book) => ({ ...book, is_favorite: false })),
      meta: {
        current_page: result.page,
        last_page: result.lastPage,
        per_page: perPage,
        total: result.total,
      },
    }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch (error) {
    console.error("[Mobile catalogue]", error);
    return NextResponse.json({ message: "Catalogue momentanément indisponible." }, { status: 503 });
  }
}
