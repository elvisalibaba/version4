import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api/client";

async function readNotifyPayload(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as unknown;
  }

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    return Object.fromEntries(
      Array.from(formData.entries()).map(([key, value]) => [
        key,
        typeof value === "string" ? value : value.name,
      ]),
    );
  }

  const text = await request.text();
  return Object.fromEntries(new URLSearchParams(text).entries());
}

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const payload = await readNotifyPayload(request);

  const response = await fetch(`${getApiBaseUrl()}/api/v1/payments/easypay/notify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const result = await response.json().catch(() => ({ message: "Réponse EasyPay invalide." }));
  return NextResponse.json(result, { status: response.status });
}
