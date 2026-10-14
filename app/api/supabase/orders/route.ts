import { NextResponse } from "next/server";
import { CheckoutError, createOrder } from "@/lib/payments/checkout";
import { getSupabaseRequestAuth } from "@/lib/supabase/request";
import { CHECKOUT_BOOK_FORMATS } from "@/lib/book-formats";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fail = (message: string, status: number) => NextResponse.json({ message }, { status });

/** Panier → commande en attente. Prix, droits et disponibilité sont revérifiés en base (hb_create_order). */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return fail("Origine non autorisée", 403);
  const auth = await getSupabaseRequestAuth(request);
  if (!auth.user) return fail("Connectez-vous pour commander", 401);

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    body = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  } catch {
    return fail("Requête invalide", 400);
  }
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 30) return fail("Le panier doit contenir de 1 à 30 lignes", 422);

  const items: Array<{ book_id: string; book_format: string; quantity: number }> = [];
  for (const input of body.items as unknown[]) {
    const item = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
    const quantity = Number(item.quantity);
    if (typeof item.book_id !== "string" || !UUID.test(item.book_id)
      || typeof item.book_format !== "string" || !(CHECKOUT_BOOK_FORMATS as readonly string[]).includes(item.book_format)
      || !Number.isSafeInteger(quantity)) return fail("Livre, format ou quantité invalide", 422);
    items.push({ book_id: item.book_id, book_format: item.book_format, quantity });
  }

  try {
    const order = await createOrder({ userId: auth.user.id, items, currency: String(body.currency_code ?? ""), source: "cart" });
    return NextResponse.json(
      { data: { id: order.order_id, payment_order_ref: order.payment_order_ref, total_price: order.total_price, currency_code: order.currency_code } },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof CheckoutError) return fail(error.message, error.status);
    console.error("[Commande] Panier :", error);
    return fail("Impossible de préparer la commande", 503);
  }
}
