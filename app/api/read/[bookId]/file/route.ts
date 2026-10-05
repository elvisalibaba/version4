import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api/client";
import { getServerAuthToken } from "@/lib/api/server";

async function proxyPage(targetUrl: string, token?: string | null, readerToken?: string | null) {
  const headers: HeadersInit = {
    Accept: "image/jpeg",
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

export async function GET(request: Request, context: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await context.params;
  const token = await getServerAuthToken();
  const encodedBookId = encodeURIComponent(bookId);
  const apiBase = getApiBaseUrl();
  const url = new URL(request.url);
  const page = Number.parseInt(url.searchParams.get("page") ?? "", 10);
  const readerToken = url.searchParams.get("readerToken");

  if (!Number.isInteger(page) || page < 1) {
    return NextResponse.json({ error: "Numéro de page invalide." }, { status: 422 });
  }

  const target = token && readerToken
    ? `${apiBase}/api/v1/read/${encodedBookId}/pages/${page}`
    : `${apiBase}/api/v1/books/${encodedBookId}/preview/pages/${page}`;

  const response = await proxyPage(target, token, readerToken);

  if (!response.ok) {
    const payload = await response.json().catch(() => ({
      error:
        response.status === 404
          ? "Cette page n’est pas disponible."
          : "Lecture impossible.",
    }));

    return NextResponse.json(payload, { status: response.status });
  }

  const responseHeaders = new Headers();
  responseHeaders.set("Content-Type", response.headers.get("content-type") ?? "image/jpeg");
  responseHeaders.set("Content-Disposition", "inline");
  responseHeaders.set("Cache-Control", "private, no-store, no-cache, must-revalidate");
  responseHeaders.set("Pragma", "no-cache");
  responseHeaders.set("X-Content-Type-Options", "nosniff");
  responseHeaders.set("X-Frame-Options", "SAMEORIGIN");
  responseHeaders.set("Referrer-Policy", "no-referrer");

  return new NextResponse(response.body, { status: 200, headers: responseHeaders });
}
