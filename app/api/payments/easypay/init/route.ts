import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api/client";
import { apiServer } from "@/lib/api/server";
import { validateCinetPayInitPayload } from "@/lib/payments/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = validateCinetPayInitPayload(body);

    const result = await apiServer<{ data: {
      orderId: string;
      transactionId: string;
      paymentUrl: string;
      reused?: boolean;
    } }>("payments/easypay/init", {
      method: "POST",
      body: {
        book_id: payload.bookId,
        order_id: payload.orderId,
        book_format: payload.bookFormat,
        channel: payload.channels,
        customer: payload.customer,
        idempotency_key: request.headers.get("idempotency-key") ?? undefined,
      },
    });

    return NextResponse.json(result.data);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        error.payload ?? { error: "Impossible de démarrer le paiement." },
        { status: error.status },
      );
    }

    const message = error instanceof Error ? error.message : "Impossible de démarrer le paiement.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
