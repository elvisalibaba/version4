import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { getCurrentUserProfile } from "@/lib/auth";
import { apiServer } from "@/lib/api/server";
import { PaymentReturnEffects } from "@/components/cart/payment-return-effects";
import type { ApiOrder } from "@/types/api";

export const dynamic = "force-dynamic";
export const metadata = { title: "Paiement | Holistique Books", robots: { index: false } };
type SearchParams = Promise<{ orderId?: string; etat?: string }>;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Final payment status is always read from Laravel, never trusted from the URL. */
export default async function PaymentReturnPage({ searchParams }: { searchParams: SearchParams }) {
  const { orderId } = await searchParams;
  if (!orderId || !UUID.test(orderId)) redirect("/dashboard/reader/purchases");

  const profile = await getCurrentUserProfile();
  if (!profile) redirect(`/login?next=${encodeURIComponent("/payment/return?orderId=" + orderId)}`);

  let order: ApiOrder | null = null;
  try {
    const initial = await apiServer<{ data: ApiOrder }>(`orders/${encodeURIComponent(orderId)}`);
    order = initial.data;
    if (order.payment_status === "pending") {
      try {
        await apiServer(`payments/easypay/orders/${encodeURIComponent(orderId)}/reconcile`, { method: "POST" });
        const refreshed = await apiServer<{ data: ApiOrder }>(`orders/${encodeURIComponent(orderId)}`);
        order = refreshed.data;
      } catch {
        // The webhook can still reconcile payment later: never invent "paid".
      }
    }
  } catch {
    // No access to this order or the Laravel API is temporarily unavailable.
  }

  const status = order?.payment_status ?? "pending";
  const paid = status === "paid";
  const failed = ["failed", "refunded"].includes(status);
  const Icon = paid ? CheckCircle2 : failed ? XCircle : Clock3;
  const title = paid ? "Paiement confirmé" : failed ? "Paiement non abouti" : "Vérification du paiement";
  const message = paid
    ? "Votre paiement a été confirmé. Retrouvez votre livre dans votre bibliothèque."
    : failed
      ? "Aucun paiement valide n'est enregistré pour cette commande."
      : "Votre paiement est en cours de vérification sur notre serveur. Consultez vos achats pour suivre son évolution.";

  return (
    <section className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
      {order ? <PaymentReturnEffects orderId={order.id} status={status} /> : null}
      <div className="rounded-md border border-rule-strong bg-white p-6">
        <Icon aria-hidden="true" className="h-8 w-8 text-brand-600" />
        <h1 className="mt-4 font-display text-2xl font-bold">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-700">{message}</p>
        {order ? <p className="mt-3 text-sm font-semibold">Commande : {order.id.slice(0, 8)}</p> : null}
        {order ? <p className="mt-1 text-sm">Montant : {order.total_price} {order.currency_code}</p> : null}
        <div className="mt-6 flex flex-wrap gap-3">
          {paid ? <Link className="cta-primary px-5 py-3 text-sm" href="/dashboard/reader/library">Ma bibliothèque</Link> : null}
          <Link className="cta-secondary px-5 py-3 text-sm" href="/dashboard/reader/purchases">Mes commandes</Link>
          <Link className="cta-secondary px-5 py-3 text-sm" href="/librairie">Librairie</Link>
        </div>
      </div>
    </section>
  );
}
