import Link from "next/link";
import { CircleDollarSign, CreditCard, Library, ShoppingCart, TrendingUp } from "lucide-react";
import { DashboardTopbar } from "@/components/ui/dashboard-topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type OrderItemWithBook = {
  price: number;
  books: { title: string; author_id: string }[] | { title: string; author_id: string } | null;
  orders: { created_at: string; payment_status: string }[] | { created_at: string; payment_status: string } | null;
};

export default async function AuthorSalesPage() {
  const profile = await requireRole(["author"]);
  const supabase = await createClient();

  const { data } = await supabase
    .from("order_items")
    .select("price, books:book_id(title, author_id), orders:order_id(created_at, payment_status)")
    .order("id", { ascending: false })
    .returns<OrderItemWithBook[]>();

  const sales = (data ?? []) as OrderItemWithBook[];
  const ownSales = sales.filter((item) => {
    const book = Array.isArray(item.books) ? item.books[0] : item.books;
    return book?.author_id === profile.id;
  });

  const paidSales = ownSales.filter((sale) => {
    const order = Array.isArray(sale.orders) ? sale.orders[0] : sale.orders;
    return order?.payment_status === "paid";
  });

  const totalRevenue = paidSales.reduce((sum, item) => sum + item.price, 0);
  const totalOrders = ownSales.length;
  const paidOrders = paidSales.length;
  const pendingOrders = totalOrders - paidOrders;

  return (
    <section className="space-y-6">
      <DashboardTopbar
        kicker="Sales analytics"
        title="Ventes auteur"
        description="Suivez vos revenus et l etat des commandes sur vos livres publies."
        actions={
          <>
            <Link href="/dashboard/author/books" className="cta-primary px-5 py-3 text-sm">
              <Library className="h-4 w-4" />
              Retour au catalogue
            </Link>
            <Link href="/dashboard/author/add-book" className="cta-secondary px-5 py-3 text-sm">
              <ShoppingCart className="h-4 w-4" />
              Ajouter un livre
            </Link>
          </>
        }
      />

      <div className="metric-grid">
        <StatCard icon={CircleDollarSign} label="Revenu total" value={`$${totalRevenue.toFixed(2)}`} description="Commandes payees" tone="emerald" />
        <StatCard icon={ShoppingCart} label="Commandes" value={totalOrders} description="Toutes ventes" tone="violet" />
        <StatCard icon={CreditCard} label="Payees" value={paidOrders} description="Transactions valides" tone="sky" />
        <StatCard icon={TrendingUp} label="En attente" value={pendingOrders} description="A confirmer" tone="amber" />
      </div>

      <section className="surface-panel p-6">
        <div className="section-header">
          <div className="space-y-2">
            <p className="section-kicker">Sales log</p>
            <h2 className="section-title text-2xl">Historique des ventes</h2>
            <p className="section-description">Une vision plus claire des commandes qui concernent votre catalogue.</p>
          </div>
          <span className="catalog-badge">{totalOrders} lignes</span>
        </div>

        <div className="mt-5 space-y-3">
          {ownSales.length > 0 ? (
            ownSales.map((sale, index) => {
              const book = Array.isArray(sale.books) ? sale.books[0] : sale.books;
              const order = Array.isArray(sale.orders) ? sale.orders[0] : sale.orders;
              const isPaid = order?.payment_status === "paid";

              return (
                <article key={`${book?.title ?? "sale"}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-violet-100 bg-[linear-gradient(135deg,_rgba(255,255,255,0.95),_rgba(244,239,255,0.92))] p-4">
                  <div>
                    <p className="font-semibold text-slate-950">{book?.title ?? "Livre supprime"}</p>
                    <p className="text-xs text-slate-500">
                      {order?.created_at ? new Date(order.created_at).toLocaleDateString("fr-FR") : "Date inconnue"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-slate-950">${sale.price.toFixed(2)}</p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        isPaid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {order?.payment_status ?? "unknown"}
                    </span>
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState title="Aucune vente enregistree" description="Les ventes de vos livres apparaitront ici des qu elles remonteront depuis les commandes." />
          )}
        </div>
      </section>
    </section>
  );
}
