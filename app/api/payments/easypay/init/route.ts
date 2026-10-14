import { NextResponse } from "next/server";
import { CheckoutError, createOrder, startEasyPayCheckout } from "@/lib/payments/checkout";
import { validateCinetPayInitPayload } from "@/lib/payments/validation";
import { getSupabaseRequestAuth } from "@/lib/supabase/request";

export const dynamic = "force-dynamic";

/**
 * Lance un paiement EasyPay : « Acheter maintenant » (bookId + format) ou panier (orderId).
 * La commande est créée en base (prix relus par hb_create_order), puis initialisée côté serveur.
 */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Origine non autorisée." }, { status: 403 });
  }
  const auth = await getSupabaseRequestAuth(request);
  if (!auth.user) return NextResponse.json({ error: "Connectez-vous pour lancer un paiement." }, { status: 401 });

  let payload: ReturnType<typeof validateCinetPayInitPayload>;
  try {
    payload = validateCinetPayInitPayload(await request.json());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Demande de paiement invalide." }, { status: 422 });
  }

  try {
    const orderId = payload.bookId
      ? (await createOrder({
          userId: auth.user.id,
          items: [{ book_id: payload.bookId, book_format: payload.bookFormat ?? "ebook", quantity: 1 }],
          currency: payload.currency,
          source: "buy_now",
        })).order_id
      : payload.orderId!;
    const result = await startEasyPayCheckout({
      userId: auth.user.id,
      userEmail: auth.user.email ?? null,
      orderId,
      channel: payload.channels,
      customer: payload.customer,
      origin: new URL(request.url).origin,
    });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof CheckoutError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("[EasyPay] Lancement du paiement :", error);
    return NextResponse.json({ error: "Paiement momentanément indisponible. Réessayez dans quelques minutes." }, { status: 500 });
  }
}
