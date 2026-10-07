import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { PaymentReturnEffects } from "@/components/cart/payment-return-effects";
import { getBookFormatLabel } from "@/lib/book-formats";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { apiServer } from "@/lib/api/server";
import { getCurrentUserProfile } from "@/lib/auth";
import type { ApiOrder, OrderPaymentStatus } from "@/types/api";

type SearchParams = Promise<{
  orderId?: string;
}>;

export const dynamic = "force-dynamic";

function getStatusCopy(status: OrderPaymentStatus) {
  switch (status) {
    case "paid":
      return {
        title: "Paiement confirmé",
        description: "Votre commande est payée. Les achats numériques sont disponibles dans votre bibliothèque.",
        accent: "bg-emerald-50 text-emerald-800 border-emerald-200",
      };
    case "failed":
      return {
        title: "Paiement échoué",
        description: "La transaction a été refusée ou n’a pas abouti. Vous pouvez relancer un paiement.",
        accent: "bg-brand-50 text-brand-800 border-brand-100",
      };
    case "refunded":
      return {
        title: "Paiement remboursé",
        description: "Cette commande a été marquée comme remboursée.",
        accent: "bg-amber-50 text-amber-700 border-amber-200",
      };
    default:
      return {
        title: "Vérification du paiement",
        description: "Nous vérifions votre paiement auprès d’EasyPay. Cette page se met à jour automatiquement.",
        accent: "bg-slate-100 text-slate-700 border-slate-200",
      };
  }
}

async function loadOrder(orderId: string) {
  return (await apiServer<{ data: ApiOrder }>(`orders/${encodeURIComponent(orderId)}`)).data;
}

export default async function PaymentReturnPage({ searchParams }: { searchParams: SearchParams }) {
  const { orderId } = await searchParams;

  if (!orderId) {
    redirect("/dashboard/reader/purchases");
  }

  const profile = await getCurrentUserProfile();
  if (!profile) {
    redirect(`/login?next=${encodeURIComponent(`/payment/return?orderId=${orderId}`)}`);
  }

  let order: ApiOrder;

  try {
    order = await loadOrder(orderId);

    if (order.payment_status === "pending" && (order.payment_provider === "easypay" || order.payment_provider === "cinetpay")) {
      try {
        await apiServer(`payments/easypay/orders/${encodeURIComponent(orderId)}/reconcile`, {
          method: "POST",
        });
        order = await loadOrder(orderId);
      } catch {
        // Le provider peut être momentanément indisponible. On conserve le statut pending.
      }
    }
  } catch (error) {
    if (error instanceof ApiError && [401, 403, 404].includes(error.status)) {
      redirect("/dashboard/reader/purchases");
    }
    throw error;
  }

  const statusCopy = getStatusCopy(order.payment_status);
  const money = (amount: number | string, currency: string) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(Number(amount));

  return (
    <div className="hb-fullbleed bg-slate-50">
      <PaymentReturnEffects orderId={order.id} status={order.payment_status} />
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="hb-fade-up rounded-lg border border-slate-200 bg-white">
          <div className={`flex items-start gap-4 border-b px-6 py-6 ${statusCopy.accent}`}>
            <StatusIcon status={order.payment_status} />
            <div>
              <h1 className="text-2xl font-bold">{statusCopy.title}</h1>
              <p className="mt-1.5 text-sm leading-6">{statusCopy.description}</p>
            </div>
          </div>

          <dl className="grid gap-4 border-b border-slate-200 px-6 py-5 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-slate-500">Commande</dt>
              <dd className="mt-1 font-mono text-xs font-semibold text-slate-900">{order.id.slice(0, 8).toUpperCase()}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Statut</dt>
              <dd className="mt-1 font-semibold text-slate-900">{STATUS_LABELS[order.payment_status] ?? order.payment_status}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Montant</dt>
              <dd className="mt-1 font-semibold text-slate-900">{money(order.total_price, order.currency_code)}</dd>
            </div>
          </dl>

          <ul className="divide-y divide-slate-200 px-6">
            {(order.items ?? []).map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-3.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{item.title ?? "Livre Holistique Books"}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {getBookFormatLabel(item.book_format)}
                    {item.quantity && item.quantity > 1 ? ` · Qté ${item.quantity}` : ""}
                  </p>
                </div>
                <p className="shrink-0 font-semibold text-slate-900">{money(item.price, item.currency_code)}</p>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2 border-t border-slate-200 px-6 py-5 sm:flex-row">
            {order.payment_status === "failed" ? (
              <Link href="/cart" className="cta-primary inline-flex min-h-11 items-center justify-center px-5 text-sm">Revenir au panier</Link>
            ) : (
              <Link href="/dashboard/reader/library" className="cta-primary inline-flex min-h-11 items-center justify-center px-5 text-sm">Ouvrir ma bibliothèque</Link>
            )}
            <Link href="/dashboard/reader/purchases" className="cta-secondary inline-flex min-h-11 items-center justify-center px-5 text-sm">Voir mes achats</Link>
            <Link href="/books" className="inline-flex min-h-11 items-center justify-center px-3 text-sm font-medium text-slate-700 hover:text-brand-700 sm:ml-auto">Continuer mes achats</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  paid: "Payée",
  pending: "En cours de vérification",
  failed: "Échouée",
  refunded: "Remboursée",
};

function StatusIcon({ status }: { status: OrderPaymentStatus }) {
  if (status === "paid") return <CheckCircle2 className="hb-check-pop h-9 w-9 shrink-0" aria-hidden="true" />;
  if (status === "failed") return <XCircle className="h-9 w-9 shrink-0" aria-hidden="true" />;
  return <span className="hb-spinner mt-1 h-7 w-7 shrink-0 border-[3px]" aria-hidden="true" />;
}
