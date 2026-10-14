import { NextResponse } from "next/server";
import { CheckoutError, reconcileOrder } from "@/lib/payments/checkout";

export const dynamic = "force-dynamic";

const REFERENCE = /^[A-Za-z0-9._-]{4,80}$/;

/**
 * Rappel serveur éventuel d'EasyPay (non prévu par la documentation e-COM). Son contenu n'est
 * JAMAIS cru : il ne sert qu'à déclencher la même vérification checking-status que le retour
 * navigateur et la réconciliation planifiée, avec la référence enregistrée en base.
 */
async function referenceFrom(request: Request): Promise<string | null> {
  const type = request.headers.get("content-type") ?? "";
  let payload: Record<string, unknown> = {};
  try {
    if (type.includes("application/json")) payload = (await request.json()) as Record<string, unknown>;
    else payload = Object.fromEntries(new URLSearchParams(await request.text()));
  } catch {
    return null;
  }
  const nested = (key: string) => {
    const value = payload[key];
    return value && typeof value === "object" ? (value as Record<string, unknown>).reference : undefined;
  };
  const candidate = payload.reference ?? nested("transaction") ?? nested("payment");
  return typeof candidate === "string" && REFERENCE.test(candidate) ? candidate : null;
}

export async function POST(request: Request) {
  const reference = await referenceFrom(request);
  if (!reference) return NextResponse.json({ ok: false }, { status: 400 });
  try {
    await reconcileOrder({ providerReference: reference }, "notify");
  } catch (error) {
    if (!(error instanceof CheckoutError)) console.error("[EasyPay] Notification :", error);
  }
  // Réponse identique quel que soit le résultat : rien n'est révélé à l'appelant.
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
