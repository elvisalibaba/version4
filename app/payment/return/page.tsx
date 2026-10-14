import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock3, ShieldAlert, XCircle } from "lucide-react";
import { PaymentReturnEffects } from "@/components/cart/payment-return-effects";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getBookFormatLabel } from "@/lib/book-formats";
import type { BookFormatType } from "@/types/api";
import { reconcileOrder } from "@/lib/payments/checkout";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getSupabaseUser } from "@/lib/supabase/user";

export const dynamic = "force-dynamic";
export const metadata = { title: "Paiement | Holistique Books", robots: { index: false } };

type SearchParams = Promise<{ o?: string; etat?: string; orderId?: string }>;

const ORDER_REF = /^HB[A-Z2-7]{12}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Message d'attente selon l'URL de retour ; le statut final vient TOUJOURS de checking-status. */
function waitingCopy(etat: string | undefined) {
  if (etat === "annule") return "Vous avez annulé le paiement chez EasyPay. Nous vérifions l'état de la transaction.";
  if (etat === "erreur") return "EasyPay a signalé un problème. Nous vérifions l'état réel de la transaction.";
  return "Nous confirmons votre paiement auprès d'EasyPay. Cette page se met à jour automatiquement.";
}

function statusCopy(status: string, etat: string | undefined) {
  switch (status) {
    case "paid":
      return { icon: CheckCircle2, tone: "border-emerald-200 bg-emerald-50 text-emerald-900", title: "Paiement confirmé", text: "Merci ! Le livre est dans votre bibliothèque." };
    case "failed":
      return { icon: XCircle, tone: "border-rose-200 bg-rose-50 text-rose-900", title: "Paiement non abouti", text: "Aucun montant n'a été validé pour cette commande. Vous pouvez réessayer." };
    case "needs_review":
      return { icon: ShieldAlert, tone: "border-amber-200 bg-amber-50 text-amber-900", title: "Paiement en cours de vérification", text: "EasyPay a répondu, mais un contrôle manuel est nécessaire. Notre équipe valide votre commande au plus vite ; vous serez prévenu." };
    case "expired":
      return { icon: Clock3, tone: "border-rule bg-paper-deep text-night-900", title: "Commande expirée", text: "Cette commande n'a pas été payée à temps. Relancez l'achat depuis la fiche du livre." };
    case "refunded":
      return { icon: Clock3, tone: "border-rule bg-paper-deep text-night-900", title: "Paiement remboursé", text: "Cette commande a été remboursée." };
    default:
      return { icon: Clock3, tone: "border-rule bg-paper-deep text-night-900", title: "Vérification du paiement", text: waitingCopy(etat) };
  }
}

export default async function PaymentReturnPage({ searchParams }: { searchParams: SearchParams }) {
  const { o, etat, orderId } = await searchParams;
  const ref = typeof o === "string" && ORDER_REF.test(o) ? o : null;
  const legacyId = !ref && typeof orderId === "string" && UUID.test(orderId) ? orderId : null;
  if (!ref && !legacyId) redirect("/dashboard/reader/purchases");

  const user = await getSupabaseUser();
  if (!user) {
    const back = ref ? `/payment/return?o=${ref}${etat ? `&etat=${encodeURIComponent(etat)}` : ""}` : `/payment/return?orderId=${legacyId}`;
    redirect(`/login?next=${encodeURIComponent(back)}`);
  }

  // types/database.ts ne connaît pas encore payment_order_ref (types générés à régénérer).
  const db = createServiceRoleClient() as unknown as SupabaseClient;
  const { data: order } = await (ref
    ? db.from("orders").select("id,user_id,payment_status,payment_order_ref,total_price,currency_code").eq("payment_order_ref", ref).maybeSingle()
    : db.from("orders").select("id,user_id,payment_status,payment_order_ref,total_price,currency_code").eq("id", legacyId!).maybeSingle());
  // Une commande d'un autre compte est traitée comme introuvable.
  if (!order || order.user_id !== user.id) redirect("/dashboard/reader/purchases");

  let status = order.payment_status as string;
  if (status === "pending") {
    try {
      status = (await reconcileOrder({ orderId: order.id }, "return")).status;
    } catch (error) {
      console.error("[Paiement] Vérification au retour impossible :", error);
    }
  }

  const { data: items } = await db
    .from("order_items")
    .select("id,book_id,book_format,price,currency_code,books(title)")
    .eq("order_id", order.id);
  const lines = (items ?? []) as unknown as Array<{ id: string; book_id: string; book_format: string; price: number; currency_code: string; books: { title?: string } | null }>;
  const firstBookId = lines[0]?.book_id ?? null;
  const money = (amount: number, currency: string) => new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(Number(amount));
  const copy = statusCopy(status, etat);
  const Icon = copy.icon;

  return (
    <section className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
      <PaymentReturnEffects orderId={order.id} status={status} />
      <div className={`rounded-md border p-6 ${copy.tone}`} role="status" aria-live="polite">
        <div className="flex items-start gap-4">
          <Icon aria-hidden="true" className="mt-1 h-7 w-7 shrink-0" />
          <div>
            <h1 className="font-display text-2xl font-semibold">{copy.title}</h1>
            <p className="mt-2 text-sm leading-6">{copy.text}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-rule bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Commande {order.payment_order_ref ?? ""}</p>
        <ul className="mt-3 divide-y divide-rule">
          {lines.map((line) => (
            <li key={line.id} className="flex items-center justify-between gap-4 py-3 text-sm">
              <span>
                <span className="font-semibold text-night-900">{line.books?.title ?? "Livre"}</span>
                <span className="ml-2 text-slate-500">{getBookFormatLabel(line.book_format as BookFormatType)}</span>
              </span>
              <span className="tabular-nums text-night-900">{money(line.price, line.currency_code)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex justify-between border-t border-rule pt-3 text-sm font-semibold text-night-900">
          <span>Total</span><span className="tabular-nums">{money(order.total_price, order.currency_code)}</span>
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {status === "paid" && firstBookId ? (
          <Link href={`/book/${firstBookId}`} className="cta-primary px-5 py-3 text-sm">Lire maintenant</Link>
        ) : null}
        {(status === "failed" || status === "expired") && firstBookId ? (
          <Link href={`/book/${firstBookId}`} className="cta-primary px-5 py-3 text-sm">Réessayer</Link>
        ) : null}
        <Link href="/dashboard/reader/library" className="cta-secondary px-5 py-3 text-sm">Ma bibliothèque</Link>
      </div>
    </section>
  );
}
