import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api/client";
import { getServerAuthToken } from "@/lib/api/server";

export async function GET(_request: Request, context: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await context.params;
  const token = await getServerAuthToken();
  const encodedBookId = encodeURIComponent(bookId);
  const targetUrl = token
    ? `${getApiBaseUrl()}/api/v1/read/${encodedBookId}`
    : `${getApiBaseUrl()}/api/v1/books/${encodedBookId}/read-free`;

  const headers: HeadersInit = { Accept: "*/*" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(targetUrl, {
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "Lecture impossible." }));
    return NextResponse.json(payload, { status: response.status });
  }

  const responseHeaders = new Headers();
  responseHeaders.set("Content-Type", response.headers.get("content-type") ?? "application/octet-stream");
  responseHeaders.set("Content-Disposition", response.headers.get("content-disposition") ?? "inline");
  responseHeaders.set("Cache-Control", "private, no-store, no-cache, must-revalidate");
  responseHeaders.set("X-Content-Type-Options", "nosniff");

  return new NextResponse(response.body, { status: 200, headers: responseHeaders });
}
