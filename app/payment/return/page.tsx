import Link from "next/link";
import { redirect } from "next/navigation";
import { reconcileCinetPayOrder } from "@/lib/payments/cinetpay";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type SearchParams = Promise<{
  orderId?: string;
}>;

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

export const dynamic = "force-dynamic";

function getStatusCopy(status: OrderRow["payment_status"]) {
  switch (status) {
    case "paid":
      return {
        title: "Paiement confirme",
        description: "Votre commande est payee. Les achats ebook sont ajoutes a votre bibliotheque numerique.",
        accent: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "failed":
      return {
        title: "Paiement echoue",
        description: "La transaction a ete refusee ou n a pas abouti. Vous pouvez relancer un paiement proprement.",
        accent: "bg-rose-50 text-rose-700 border-rose-200",
      };
    case "refunded":
      return {
        title: "Paiement rembourse",
        description: "Cette commande a ete marquee comme remboursee.",
        accent: "bg-amber-50 text-amber-700 border-amber-200",
      };
    default:
      return {
        title: "Verification du paiement",
        description: "Nous verifions encore la transaction avec EasyPay. Cette page ne se base jamais uniquement sur les query params du navigateur.",
        accent: "bg-slate-100 text-slate-700 border-slate-200",
      };
  }
}

export default async function PaymentReturnPage({ searchParams }: { searchParams: SearchParams }) {
  const { orderId } = await searchParams;

  if (!orderId) {
    redirect("/dashboard/reader/purchases");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/payment/return?orderId=${orderId}`)}`);
  }

  const initialOrderResult = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .returns<OrderRow>()
    .maybeSingle();

  let order: OrderRow | null = (initialOrderResult.data ?? null) as OrderRow | null;

  if (
    order?.payment_status === "pending" &&
    (order.payment_provider === "easypay" || order.payment_provider === "cinetpay") &&
    order.payment_transaction_id
  ) {
    try {
      await reconcileCinetPayOrder(order.id);
      const refreshed = await supabase.from("orders").select("*").eq("id", order.id).eq("user_id", user.id).returns<OrderRow>().maybeSingle();
      order = refreshed.data ?? order;
    } catch {
      // We keep the order in pending view if provider reconciliation is temporarily unavailable.
    }
  }

  if (!order) {
    redirect("/dashboard/reader/purchases");
  }

  const resolvedOrder = order;

  const { data: items } = await supabase
    .from("order_items")
    .select("id, price, currency_code, book_format, books:book_id(id, title)")
    .eq("order_id", resolvedOrder.id);

  const statusCopy = getStatusCopy(resolvedOrder.payment_status);

  return (
    <section className="page-hero-shell space-y-8 py-12">
      <div className="surface-panel space-y-6 p-8">
        <div className={`rounded-[1.6rem] border px-5 py-4 ${statusCopy.accent}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em]">EasyPay redirect return</p>
          <h1 className="mt-2 text-3xl font-semibold">{statusCopy.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7">{statusCopy.description}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.4rem] border border-violet-100 bg-violet-50/50 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Commande</p>
            <p className="mt-2 break-all text-sm font-semibold text-slate-950">{resolvedOrder.id}</p>
          </div>
          <div className="rounded-[1.4rem] border border-violet-100 bg-violet-50/50 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Statut</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">{resolvedOrder.payment_status}</p>
          </div>
          <div className="rounded-[1.4rem] border border-violet-100 bg-violet-50/50 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Montant</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: resolvedOrder.currency_code,
              }).format(resolvedOrder.total_price)}
            </p>
          </div>
        </div>

        <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Livres de la commande</p>
          <div className="mt-4 space-y-3">
            {(items ?? []).map((item) => {
              const book = Array.isArray(item.books) ? item.books[0] : item.books;
              return (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[1.2rem] border border-slate-100 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{book?.title ?? "Livre HolistiqueBooks"}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">{item.book_format}</p>
                  </div>
                  <p className="text-sm text-slate-500">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: item.currency_code,
                    }).format(item.price)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/reader/purchases" className="cta-primary px-5 py-3 text-sm">
            Voir mes achats
          </Link>
          <Link href="/dashboard/reader/library" className="cta-secondary px-5 py-3 text-sm">
            Ouvrir ma bibliotheque
          </Link>
        </div>
      </div>
    </section>
  );
}
