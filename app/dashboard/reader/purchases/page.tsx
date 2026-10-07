import Link from "next/link";
import { CreditCard, Receipt, ShoppingBag, Wallet } from "lucide-react";
import { DashboardTopbar } from "@/components/ui/dashboard-topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { requireRole } from "@/lib/auth";
import { getReaderOrders } from "@/lib/reader-api";

function money(value: number | string, currency: string) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value ?? 0));
}

export default async function ReaderPurchasesPage() {
  await requireRole(["reader"]);
  const orders = await getReaderOrders();
  const paid = orders.filter((order) => order.payment_status === "paid");
  const spent = paid.reduce((sum, order) => sum + Number(order.total_price), 0);

  return (
    <section className="space-y-6">
      <DashboardTopbar kicker="Transactions" title="Mes commandes" description="L’historique de vos achats et l’état de chaque paiement." actions={<Link href="/dashboard/reader/library" className="cta-primary px-5 py-3 text-sm"><ShoppingBag className="h-4 w-4" /> Bibliothèque</Link>} />
      <div className="metric-grid">
        <StatCard icon={Receipt} label="Commandes" value={orders.length} description="Total" tone="violet" />
        <StatCard icon={CreditCard} label="Payées" value={paid.length} description="Confirmées" tone="emerald" />
        <StatCard icon={Wallet} label="Budget" value={money(spent, "USD")} description="Montant payé" tone="amber" />
      </div>
      <section className="surface-panel p-6">
        {orders.length ? <div className="space-y-3">{orders.map((order) => (
          <article key={order.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-xs font-semibold text-slate-600">#{order.id.slice(0, 8).toUpperCase()}</p><p className="mt-1 font-semibold">{new Date(order.created_at).toLocaleDateString("fr-FR")}</p></div>
              <div className="text-right"><p className="font-bold">{money(order.total_price, order.currency_code)}</p><span className="catalog-badge">{order.payment_status}</span></div>
            </div>
            {order.items?.length ? <p className="mt-3 text-sm text-slate-600">{order.items.map((item) => item.title ?? "Livre").join(" · ")}</p> : null}
          </article>
        ))}</div> : <EmptyState title="Aucune commande" description="Vos commandes apparaîtront ici." />}
      </section>
    </section>
  );
}
