import Link from "next/link";
import { ArrowLeft, CircleDollarSign, Plus, ShoppingCart } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Database, OrderPaymentStatus } from "@/types/database";

type OrderItemWithBook = Database["public"]["Functions"]["get_current_author_sales"]["Returns"][number];

type DisplayOrderStatus = OrderPaymentStatus | "unknown";

type OrderSummary = {
  id: string;
  createdAt: string | null;
  status: DisplayOrderStatus;
  titles: string[];
  itemCount: number;
  amounts: Map<string, number>;
};

const statusMeta: Record<DisplayOrderStatus, { label: string; className: string }> = {
  paid: { label: "Payée", className: "bg-emerald-100 text-emerald-700" },
  pending: { label: "En attente", className: "bg-amber-100 text-amber-800" },
  failed: { label: "Échouée", className: "bg-rose-100 text-rose-700" },
  refunded: { label: "Remboursée", className: "bg-slate-200 text-slate-700" },
  unknown: { label: "À vérifier", className: "bg-slate-100 text-slate-600" },
};

function formatMoney(amount: number, currencyCode: string) {
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currencyCode}`;
  }
}

function formatAmounts(amounts: Map<string, number>, emptyLabel = "Montant indisponible") {
  if (amounts.size === 0) return emptyLabel;
  return [...amounts.entries()].map(([currencyCode, amount]) => formatMoney(amount, currencyCode)).join(" • ");
}

function formatShortDate(value: string | null) {
  if (!value) return "Date inconnue";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export default async function AuthorSalesPage() {
  await requireRole(["author"]);
  const supabase = await createClient();

  const { data } = await supabase.rpc("get_current_author_sales");

  const ownSales = (data ?? []) as OrderItemWithBook[];
  const summariesByOrder = new Map<string, OrderSummary>();
  const paidRevenueByCurrency = new Map<string, number>();

  for (const sale of ownSales) {
    const status = sale.payment_status ?? "unknown";
    const currencyCode = sale.currency_code?.trim() || "USD";
    const summary = summariesByOrder.get(sale.order_id) ?? {
      id: sale.order_id,
      createdAt: sale.created_at ?? null,
      status,
      titles: [],
      itemCount: 0,
      amounts: new Map<string, number>(),
    };

    const title = sale.title ?? "Livre supprimé";
    if (!summary.titles.includes(title)) summary.titles.push(title);
    summary.itemCount += 1;
    summary.amounts.set(currencyCode, (summary.amounts.get(currencyCode) ?? 0) + Number(sale.price ?? 0));
    summariesByOrder.set(sale.order_id, summary);

    if (status === "paid") {
      paidRevenueByCurrency.set(
        currencyCode,
        (paidRevenueByCurrency.get(currencyCode) ?? 0) + Number(sale.price ?? 0),
      );
    }
  }

  const orderSummaries = [...summariesByOrder.values()].sort(
    (left, right) => new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime(),
  );
  const totalOrders = orderSummaries.length;
  const paidOrders = orderSummaries.filter((order) => order.status === "paid").length;
  const pendingOrders = orderSummaries.filter((order) => order.status === "pending").length;
  const failedOrders = orderSummaries.filter((order) => order.status === "failed").length;
  const refundedOrders = orderSummaries.filter((order) => order.status === "refunded").length;
  const formattedRevenue = formatAmounts(paidRevenueByCurrency, "Aucun revenu confirmé");

  return (
    <section className="space-y-4 sm:space-y-6">
      <header className="flex flex-col gap-5 rounded-[28px] bg-[#173d2c] p-6 text-white sm:flex-row sm:items-end sm:justify-between sm:p-8"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#f2c66f]">Activité commerciale</p><h1 className="mt-3 font-serif text-3xl sm:text-4xl">Mes ventes</h1><p className="mt-2 text-sm text-white/65">Suivez simplement les paiements de vos livres.</p></div><div className="flex flex-wrap gap-2"><Link href="/dashboard/author/books" className="inline-flex h-11 items-center gap-2 rounded-full border border-white/20 px-4 text-sm font-bold"><ArrowLeft className="h-4 w-4" />Mes livres</Link><Link href="/dashboard/author/add-book" className="inline-flex h-11 items-center gap-2 rounded-full bg-[#e8ac42] px-4 text-sm font-bold text-[#173d2c]"><Plus className="h-4 w-4" />Ajouter</Link></div></header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[{ label: "Revenus confirmés", value: formattedRevenue, icon: CircleDollarSign }, { label: "Commandes", value: totalOrders, icon: ShoppingCart }, { label: "Payées", value: paidOrders, icon: CircleDollarSign }, { label: "En attente", value: pendingOrders, icon: ShoppingCart }].map((item) => { const Icon = item.icon; return <article key={item.label} className="rounded-2xl border border-[#ded3c2] bg-white p-4 sm:p-5"><Icon className="h-5 w-5 text-[#b85135]" /><p className="mt-4 text-xl font-bold text-[#17231d] sm:text-2xl">{item.value}</p><p className="mt-1 text-xs font-semibold text-[#766e64]">{item.label}</p></article>; })}
      </div>

      <section className="rounded-[28px] border border-[#ded3c2] bg-white p-4 sm:p-6">
        <div className="section-header">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#a94b34]">Historique</p>
            <h2 className="font-serif text-xl text-[#17231d] sm:text-2xl">Commandes reçues</h2>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="catalog-badge">{totalOrders} commande{totalOrders > 1 ? "s" : ""}</span>
            {failedOrders > 0 ? <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-700">{failedOrders} échouée{failedOrders > 1 ? "s" : ""}</span> : null}
            {refundedOrders > 0 ? <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">{refundedOrders} remboursée{refundedOrders > 1 ? "s" : ""}</span> : null}
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {orderSummaries.length > 0 ? (
            orderSummaries.map((order) => (
              <article
                key={order.id}
                className="flex flex-col gap-4 rounded-[1.5rem] border border-[#ece3d7] bg-[linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(250,245,239,0.96))] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Commande #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="mt-1 break-words font-semibold text-slate-950">{order.titles.join(" · ")}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatShortDate(order.createdAt)} · {order.itemCount} article{order.itemCount > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                  <p className="text-sm font-semibold text-slate-950">{formatAmounts(order.amounts)}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusMeta[order.status].className}`}>
                    {statusMeta[order.status].label}
                  </span>
                </div>
              </article>
            ))
          ) : (
            <EmptyState title="Aucune vente enregistrée" description="Les commandes de vos livres apparaîtront ici dès qu’un paiement sera initié." />
          )}
        </div>
      </section>
    </section>
  );
}
