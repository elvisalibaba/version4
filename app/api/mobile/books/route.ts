import { NextResponse } from "next/server";
import { apiClient, ApiError } from "@/lib/api/client";
import type { ApiBook, ApiPagination } from "@/types/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requested = new URL(request.url).searchParams;
  const params = new URLSearchParams();
  for (const field of ["search", "category", "page", "per_page", "sort", "language", "work_type"]) {
    const value = requested.get(field);
    if (value) params.set(field, value);
  }
  try {
    const response = await apiClient<ApiPagination<ApiBook>>(`books?${params.toString()}`, { cache: "no-store" });
    return NextResponse.json({
      ...response,
      data: (response.data ?? []).map((book) => ({ ...book, is_favorite: false })),
    }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json(error.payload ?? { message: "Catalogue indisponible." }, { status: error.status });
    return NextResponse.json({ message: "Catalogue indisponible." }, { status: 503 });
  }
}
