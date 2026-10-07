import Link from "next/link";
import {
  ArrowLeft,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Plus,
  Receipt,
  ShoppingBag,
  WalletCards,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth";
import { getAuthorFinanceSummary, getAuthorSales } from "@/lib/author-api";

function money(value: number | string | null | undefined, currency = "USD") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

const paymentStatus: Record<string, { label: string; className: string }> = {
  paid: { label: "Payé", className: "bg-emerald-50 text-emerald-700" },
  pending: { label: "En attente", className: "bg-amber-50 text-amber-800" },
  failed: { label: "Échec", className: "bg-red-50 text-red-700" },
  refunded: { label: "Remboursé", className: "bg-night-50 text-night-700" },
};

export default async function AuthorSalesPage() {
  await requireRole(["author"]);
  const [sales, finance] = await Promise.all([getAuthorSales(), getAuthorFinanceSummary()]);

  const paid = sales.filter((sale) => sale.payment_status === "paid");
  const pending = sales.filter((sale) => sale.payment_status === "pending");
  const revenue = paid.reduce(
    (sum, sale) => sum + Number(sale.price ?? 0) * Math.max(1, Number(sale.quantity ?? 1)),
    0,
  );
  const units = paid.reduce((sum, sale) => sum + Math.max(1, Number(sale.quantity ?? 1)), 0);
  const average = units > 0 ? revenue / units : 0;
  const currency = finance.account?.currency_code ?? String(paid[0]?.currency_code ?? "USD");

  return (
    <section className="space-y-6">
      <header className="overflow-hidden rounded-xl bg-night-900 p-6 text-white shadow-md sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-brand-300">
              <Receipt className="h-3.5 w-3.5" />
              Activité commerciale
            </div>
            <h1 className="mt-4 font-bold text-3xl tracking-[-0.03em] sm:text-4xl">Ventes & commandes</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/65">
              Chaque vente de vos livres, avec le statut réel du paiement.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/author/finance" className="inline-flex h-11 items-center gap-2 rounded-full border border-white/20 px-4 text-sm font-bold">
              <WalletCards className="h-4 w-4" />
              Finances
            </Link>
            <Link href="/dashboard/author/add-book" className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-600 px-4 text-sm font-bold text-white">
              <Plus className="h-4 w-4" />
              Publier
            </Link>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        {[
          { label: "CA confirmé", value: money(revenue, currency), icon: CircleDollarSign, detail: "Commandes payées" },
          { label: "Ventes payées", value: paid.length, icon: ShoppingBag, detail: `${units} exemplaire(s)` },
          { label: "En attente", value: pending.length, icon: Clock3, detail: "Paiement non confirmé" },
          { label: "Prix moyen", value: money(average, currency), icon: CreditCard, detail: "Par exemplaire payé" },
          { label: "Royalties", value: money(finance.royalties.lifetime, currency), icon: WalletCards, detail: "Gains auteur cumulés" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="rounded-xl border border-slate-300 bg-white p-5 shadow-md">
              <Icon className="h-5 w-5 text-brand-600" />
              <p className="mt-4 truncate text-2xl font-bold tracking-[-0.04em] text-night-900">{item.value}</p>
              <p className="mt-1 text-xs font-semibold text-slate-600">{item.label}</p>
              <p className="mt-1 truncate text-[0.68rem] text-slate-500">{item.detail}</p>
            </article>
          );
        })}
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="font-bold text-2xl text-night-900">Historique des ventes</h2>
            <p className="mt-1 text-sm text-slate-600">{sales.length} ligne(s) de commande chargée(s).</p>
          </div>
          <Link href="/dashboard/author/books" className="inline-flex items-center gap-2 text-sm font-bold text-brand-600">
            <ArrowLeft className="h-4 w-4" />
            Mes livres
          </Link>
        </div>

        {sales.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="px-6 py-3 font-bold">Livre</th>
                  <th className="px-4 py-3 font-bold">Format</th>
                  <th className="px-4 py-3 font-bold">Qté</th>
                  <th className="px-4 py-3 font-bold">Montant</th>
                  <th className="px-4 py-3 font-bold">Paiement</th>
                  <th className="px-6 py-3 text-right font-bold">Date</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale, index) => {
                  const status = String(sale.payment_status ?? "pending");
                  const statusMeta = paymentStatus[status] ?? { label: status, className: "bg-slate-100 text-slate-600" };
                  const quantity = Math.max(1, Number(sale.quantity ?? 1));
                  const total = Number(sale.price ?? 0) * quantity;
                  return (
                    <tr key={String(sale.id ?? sale.order_id ?? index)} className="border-b border-slate-200 last:border-0">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-night-900">{sale.title ?? "Livre"}</p>
                        <p className="mt-1 text-xs text-slate-500">Commande {sale.order_id ? String(sale.order_id).slice(0, 8) : "—"}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{String(sale.book_format ?? "ebook").toUpperCase()}</td>
                      <td className="px-4 py-4 text-slate-600">{quantity}</td>
                      <td className="px-4 py-4 font-bold text-night-900">{money(total, String(sale.currency_code ?? currency))}</td>
                      <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-bold ${statusMeta.className}`}>{statusMeta.label}</span></td>
                      <td className="px-6 py-4 text-right text-xs text-slate-500">{sale.created_at ? new Date(sale.created_at).toLocaleDateString("fr-FR") : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <EmptyState title="Aucune vente enregistrée" description="Les commandes de vos livres apparaîtront ici dès qu’un paiement sera enregistré." />
          </div>
        )}
      </section>
    </section>
  );
}
