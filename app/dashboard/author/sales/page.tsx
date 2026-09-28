import Link from "next/link";
import { ArrowLeft, CircleDollarSign, Plus, ShoppingCart } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth";
import { getAuthorSales } from "@/lib/author-api";

function money(value: number | string | null | undefined, currency = "USD") {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value ?? 0));
}

export default async function AuthorSalesPage() {
  await requireRole(["author"]);
  const sales = await getAuthorSales();
  const paid = sales.filter((sale) => sale.payment_status === "paid");
  const revenue = paid.reduce((sum, sale) => sum + Number(sale.price ?? 0) * Number(sale.quantity ?? 1), 0);

  return (
    <section className="space-y-4 sm:space-y-6">
      <header className="flex flex-col gap-5 rounded-[28px] bg-[#173d2c] p-6 text-white sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#f2c66f]">Activité commerciale</p><h1 className="mt-3 font-serif text-3xl sm:text-4xl">Mes ventes</h1><p className="mt-2 text-sm text-white/65">Données commerciales servies par Laravel.</p></div>
        <div className="flex flex-wrap gap-2"><Link href="/dashboard/author/books" className="inline-flex h-11 items-center gap-2 rounded-full border border-white/20 px-4 text-sm font-bold"><ArrowLeft className="h-4 w-4" />Mes livres</Link><Link href="/dashboard/author/add-book" className="inline-flex h-11 items-center gap-2 rounded-full bg-[#e8ac42] px-4 text-sm font-bold text-[#173d2c]"><Plus className="h-4 w-4" />Ajouter</Link></div>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <article className="rounded-2xl border border-[#ded3c2] bg-white p-5"><CircleDollarSign className="h-5 w-5 text-[#b85135]" /><p className="mt-4 text-2xl font-bold">{money(revenue)}</p><p className="mt-1 text-xs font-semibold text-[#766e64]">Revenus confirmés</p></article>
        <article className="rounded-2xl border border-[#ded3c2] bg-white p-5"><ShoppingCart className="h-5 w-5 text-[#b85135]" /><p className="mt-4 text-2xl font-bold">{sales.length}</p><p className="mt-1 text-xs font-semibold text-[#766e64]">Lignes de vente</p></article>
        <article className="rounded-2xl border border-[#ded3c2] bg-white p-5"><CircleDollarSign className="h-5 w-5 text-[#b85135]" /><p className="mt-4 text-2xl font-bold">{paid.length}</p><p className="mt-1 text-xs font-semibold text-[#766e64]">Ventes payées</p></article>
      </div>

      <section className="rounded-[28px] border border-[#ded3c2] bg-white p-4 sm:p-6">
        <div className="space-y-3">
          {sales.length ? sales.map((sale, index) => (
            <article key={String(sale.id ?? sale.order_id ?? index)} className="flex flex-col gap-3 rounded-[1.5rem] border border-[#ece3d7] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="font-semibold text-slate-950">{sale.title ?? "Livre"}</p><p className="mt-1 text-xs text-slate-500">{sale.created_at ? new Date(sale.created_at).toLocaleDateString("fr-FR") : "Date inconnue"}</p></div>
              <div className="text-right"><p className="font-semibold">{money(sale.price as number | string, String(sale.currency_code ?? "USD"))}</p><span className="catalog-badge">{String(sale.payment_status ?? "unknown")}</span></div>
            </article>
          )) : <EmptyState title="Aucune vente enregistrée" description="Les ventes de vos livres apparaîtront ici." />}
        </div>
      </section>
    </section>
  );
}
