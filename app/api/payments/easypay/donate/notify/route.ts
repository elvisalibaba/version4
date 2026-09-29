import { NextResponse } from "next/server";
import {
  DonationFlowError,
  getDonationTransactionIdFromNotifyPayload,
  verifyCinetPayDonationTransaction,
} from "@/lib/payments/cinetpay-donations";

async function readNotifyPayload(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as unknown;
  }

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    return Object.fromEntries(Array.from(formData.entries()).map(([key, value]) => [key, typeof value === "string" ? value : value.name]));
  }

  const text = await request.text();
  const params = new URLSearchParams(text);
  return Object.fromEntries(params.entries());
}

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  try {
    const payload = await readNotifyPayload(request);
    const transactionId = getDonationTransactionIdFromNotifyPayload(payload);

    if (!transactionId) {
      return NextResponse.json({ error: "transaction_id manquant dans la notification EasyPay." }, { status: 400 });
    }

    const verification = await verifyCinetPayDonationTransaction(transactionId);
    return NextResponse.json({ ok: true, ...verification });
  } catch (error) {
    if (error instanceof DonationFlowError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Verification EasyPay impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
