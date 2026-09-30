import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api/client";
import { apiServer, getServerAuthToken } from "@/lib/api/server";
import type { ApiBook } from "@/types/api";

export async function GET(_request: Request, context: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await context.params;

  try {
    const token = await getServerAuthToken();
    const { data: book } = await apiServer<{ data: ApiBook & { file_format?: string | null } }>(
      `books/${encodeURIComponent(bookId)}`,
      { authenticated: false },
    );

    if (token) {
      const { data: access } = await apiServer<{ data: { hasAccess: boolean } }>(
        `books/${encodeURIComponent(bookId)}/access`,
      );

      if (!access.hasAccess) {
        return NextResponse.json({ error: "Accès à ce livre refusé." }, { status: 403 });
      }
    } else if (!book.is_free) {
      return NextResponse.json({ error: "Connectez-vous pour lire ce livre." }, { status: 401 });
    }

    const fileType = book.file_format === "pdf" ? "pdf" : "epub";

    return NextResponse.json({
      readerUrl: `/api/read/${encodeURIComponent(bookId)}/file`,
      fileType,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.status === 401 ? "Connectez-vous pour lire ce livre." : "Impossible d’ouvrir ce livre." },
        { status: error.status },
      );
    }

    return NextResponse.json({ error: "Le lecteur sécurisé est indisponible." }, { status: 503 });
  }
}
