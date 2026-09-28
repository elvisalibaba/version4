import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api/client";
import { getServerAuthToken } from "@/lib/api/server";

export async function GET(_request: Request, context: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await context.params;
  const token = await getServerAuthToken();

  if (!token) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }

  const response = await fetch(`${getApiBaseUrl()}/api/v1/read/${encodeURIComponent(bookId)}`, {
    headers: {
      Accept: "*/*",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "Lecture impossible." }));
    return NextResponse.json(payload, { status: response.status });
  }

  const headers = new Headers();
  headers.set("Content-Type", response.headers.get("content-type") ?? "application/octet-stream");
  headers.set("Content-Disposition", response.headers.get("content-disposition") ?? "inline");
  headers.set("Cache-Control", "private, no-store, no-cache, must-revalidate");
  headers.set("X-Content-Type-Options", "nosniff");

  return new NextResponse(response.body, { status: 200, headers });
}
