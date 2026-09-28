import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api/client";
import { apiServer } from "@/lib/api/server";
import type { ApiBook } from "@/types/api";

export async function GET(_request: Request, context: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await context.params;

  try {
    const [{ data: access }, { data: book }] = await Promise.all([
      apiServer<{ data: { hasAccess: boolean } }>(`books/${encodeURIComponent(bookId)}/access`),
      apiServer<{ data: ApiBook & { file_format?: string | null } }>(`books/${encodeURIComponent(bookId)}`),
    ]);

    if (!access.hasAccess) {
      return NextResponse.json({ error: "Accès à ce livre refusé." }, { status: 403 });
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
