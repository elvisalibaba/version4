import { NextResponse } from "next/server";
import { initCinetPayCheckout, PaymentFlowError } from "@/lib/payments/cinetpay";
import { validateCinetPayInitPayload } from "@/lib/payments/validation";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = validateCinetPayInitPayload(body);
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Connectez-vous pour lancer un paiement." }, { status: 401 });
    }

    const result = await initCinetPayCheckout({
      userId: user.id,
      bookId: payload.bookId,
      orderId: payload.orderId,
      bookFormat: payload.bookFormat,
      channel: payload.channels,
      customer: {
        ...payload.customer,
        customerId: payload.customer.customerId ?? user.id,
      },
      appBaseUrl: new URL(request.url).origin,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PaymentFlowError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Impossible de demarrer le checkout EasyPay.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
