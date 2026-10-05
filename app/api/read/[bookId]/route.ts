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

    let useGuestPreview = !token;
    let readerToken: string | null = null;

    if (token) {
      try {
        const { data: access } = await apiServer<{
          data: {
            hasAccess: boolean;
            readerSession?: { token?: string | null; expires_at?: string | null } | null;
          };
        }>(`books/${encodeURIComponent(bookId)}/access`);

        if (access.hasAccess) {
          readerToken = access.readerSession?.token ?? null;
        } else if (book.has_sample) {
          useGuestPreview = true;
        } else {
          return NextResponse.json({ error: "Accès à ce livre refusé." }, { status: 403 });
        }
      } catch (error) {
        if (
          error instanceof ApiError
          && (error.status === 401 || error.status === 403)
          && book.has_sample
        ) {
          useGuestPreview = true;
        } else {
          throw error;
        }
      }
    } else if (!book.has_sample) {
      return NextResponse.json({ error: "Connectez-vous pour lire ce livre." }, { status: 401 });
    }

    if (book.file_format !== "pdf" && !useGuestPreview) {
      return NextResponse.json(
        { error: "Ce format doit être préparé pour la lecture sécurisée avant d’être ouvert." },
        { status: 422 },
      );
    }

    const previewPageLimit = useGuestPreview
      ? Math.max(1, Math.min(10, Number(book.sample_pages ?? 10)))
      : null;

    const query = readerToken ? `?readerToken=${encodeURIComponent(readerToken)}` : "";

    return NextResponse.json({
      readerUrl: `/api/read/${encodeURIComponent(bookId)}/file${query}`,
      fileType: "pdf",
      deliveryMode: "page_images",
      pageCount: useGuestPreview ? previewPageLimit : (book.page_count ?? null),
      isGuestPreview: useGuestPreview,
      previewPageLimit,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        {
          error:
            error.status === 401
              ? "Connectez-vous pour lire ce livre."
              : error.status === 404
                ? "Le fichier de lecture est introuvable."
                : "Impossible d’ouvrir ce livre.",
        },
        { status: error.status },
      );
    }

    return NextResponse.json({ error: "Le lecteur sécurisé est indisponible." }, { status: 503 });
  }
}
