import { NextResponse } from "next/server";
import { DonationFlowError, initCinetPayDonation } from "@/lib/payments/cinetpay-donations";
import { validateCinetPayDonationInitPayload } from "@/lib/payments/validation";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const payload = validateCinetPayDonationInitPayload(body);

    const result = await initCinetPayDonation({
      amount: payload.amount,
      currency: payload.currency,
      channel: payload.channels,
      customer: payload.customer,
      donorReference: payload.donorReference,
      note: payload.note,
      appBaseUrl: request.headers.get("origin") ?? undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof DonationFlowError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Impossible de demarrer le don CinetPay.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
