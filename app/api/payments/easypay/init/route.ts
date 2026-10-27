import { NextResponse } from "next/server";
import { getServerAuthToken } from "@/lib/api/server";
import { apiClient, ApiError } from "@/lib/api/client";
import { validateCinetPayInitPayload } from "@/lib/payments/validation";

export const dynamic = "force-dynamic";

/** Existing checkout entry point now delegates all payment creation to Laravel. */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Origine non autorisée." }, { status: 403 });
  const token = await getServerAuthToken();
  if (!token) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  try {
    const input = validateCinetPayInitPayload(await request.json());
    const payload = {
      book_id: input.bookId,
      order_id: input.orderId,
      book_format: input.bookFormat,
      channel: input.channels,
      currency_code: input.currency,
      customer: input.customer,
    };
    const result = await apiClient<{ data: { paymentUrl: string; orderId: string } }>("payments/easypay/init", { method: "POST", token, body: payload });
    return NextResponse.json(result.data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json(error.payload ?? { error: "Paiement impossible." }, { status: error.status });
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Service de paiement indisponible." }, { status: 422 });
  }
}
