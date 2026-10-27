import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api/client";

export const dynamic = "force-dynamic";

/** EasyPay webhooks are verified/reconciled by the Laravel API only. */
export async function POST(request: Request) {
  try {
    const upstream = await fetch(`${getApiBaseUrl()}/api/v1/payments/easypay/notify`, {
      method: "POST",
      headers: {
        "Content-Type": request.headers.get("content-type") ?? "application/json",
        Accept: "application/json",
      },
      body: await request.arrayBuffer(),
      cache: "no-store",
    });
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json", "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ ok: false, message: "Notification indisponible." }, { status: 503 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
