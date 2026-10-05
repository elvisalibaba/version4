import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api/client";
import { getServerAuthToken } from "@/lib/api/server";

async function proxyFile(targetUrl: string, token?: string | null, readerToken?: string | null) {
  const headers: HeadersInit = {
    Accept: "*/*",
    "X-Holistique-Reader": "web",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (readerToken) {
    headers["X-Holistique-Reader-Token"] = readerToken;
  }

  return fetch(targetUrl, {
    headers,
    cache: "no-store",
  });
}

export async function GET(_request: Request, context: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await context.params;
  const token = await getServerAuthToken();
  const encodedBookId = encodeURIComponent(bookId);
  const apiBase = getApiBaseUrl();

  let readerToken: string | null = null;

  if (token) {
    const accessResponse = await fetch(`${apiBase}/api/v1/books/${encodedBookId}/access`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "X-Holistique-Reader": "web",
      },
      cache: "no-store",
    });

    if (accessResponse.ok) {
      const accessPayload = await accessResponse.json() as {
        data?: {
          hasAccess?: boolean;
          readerSession?: { token?: string | null } | null;
        };
      };

      readerToken = accessPayload.data?.readerSession?.token ?? null;
    }
  }

  let response = token && readerToken
    ? await proxyFile(`${apiBase}/api/v1/read/${encodedBookId}`, token, readerToken)
    : await proxyFile(`${apiBase}/api/v1/books/${encodedBookId}/read-free`);

  if (token && (response.status === 401 || response.status === 403)) {
    // Le navigateur peut encore porter un cookie expiré. Pour un livre gratuit,
    // le backend public décidera lui-même si l’aperçu est autorisé.
    response = await proxyFile(`${apiBase}/api/v1/books/${encodedBookId}/read-free`);
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({
      error:
        response.status === 404
          ? "Le fichier de lecture est introuvable."
          : "Lecture impossible.",
    }));

    return NextResponse.json(payload, { status: response.status });
  }

  const responseHeaders = new Headers();
  responseHeaders.set("Content-Type", response.headers.get("content-type") ?? "application/octet-stream");
  responseHeaders.set("Content-Disposition", response.headers.get("content-disposition") ?? "inline");
  responseHeaders.set("Cache-Control", "private, no-store, no-cache, must-revalidate");
  responseHeaders.set("X-Content-Type-Options", "nosniff");

  return new NextResponse(response.body, { status: 200, headers: responseHeaders });
}
