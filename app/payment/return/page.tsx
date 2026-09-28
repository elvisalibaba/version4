import Link from "next/link";
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
        accent: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "failed":
      return {
        title: "Paiement échoué",
        description: "La transaction a été refusée ou n’a pas abouti. Vous pouvez relancer un paiement.",
        accent: "bg-rose-50 text-rose-700 border-rose-200",
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
        description: "Nous vérifions la transaction auprès d’EasyPay. Le statut affiché vient du backend Laravel.",
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

  return (
    <section className="page-hero-shell space-y-8 py-12">
      <div className="surface-panel space-y-6 p-8">
        <div className={`rounded-[1.6rem] border px-5 py-4 ${statusCopy.accent}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em]">Retour paiement EasyPay</p>
          <h1 className="mt-2 text-3xl font-semibold">{statusCopy.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7">{statusCopy.description}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.4rem] border border-violet-100 bg-violet-50/50 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Commande</p>
            <p className="mt-2 break-all text-sm font-semibold text-slate-950">{order.id}</p>
          </div>
          <div className="rounded-[1.4rem] border border-violet-100 bg-violet-50/50 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Statut</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">{order.payment_status}</p>
          </div>
          <div className="rounded-[1.4rem] border border-violet-100 bg-violet-50/50 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Montant</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: order.currency_code,
              }).format(Number(order.total_price))}
            </p>
          </div>
        </div>

        <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Livres de la commande</p>
          <div className="mt-4 space-y-3">
            {(order.items ?? []).map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[1.2rem] border border-slate-100 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.title ?? "Livre HolistiqueBooks"}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">{item.book_format}</p>
                </div>
                <p className="text-sm text-slate-500">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: item.currency_code,
                  }).format(Number(item.price))}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/reader/purchases" className="cta-primary px-5 py-3 text-sm">
            Voir mes achats
          </Link>
          <Link href="/dashboard/reader/library" className="cta-secondary px-5 py-3 text-sm">
            Ouvrir ma bibliothèque
          </Link>
        </div>
      </div>
    </section>
  );
}
