import Link from "next/link";
import { formatMoney } from "@/lib/book-offers";
import { listAdminOrders } from "@/lib/supabase/admin/orders";
import { formatAdminDateTime } from "@/lib/supabase/admin/shared";
import { AdminFilterBar } from "@/components/admin/filters/admin-filter-bar";
import { AdminSearchInput } from "@/components/admin/filters/admin-search-input";
import { AdminSelect } from "@/components/admin/filters/admin-select";
import { AdminDataTable } from "@/components/admin/tables/admin-data-table";
import { AdminPagination } from "@/components/admin/tables/admin-pagination";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminPanel } from "@/components/admin/shared/admin-panel";
import { StatusBadge } from "@/components/admin/shared/status-badge";
import { AdminNotice } from "@/components/admin/shared/admin-notice";

type OrdersPageProps = {
  searchParams: Promise<{
    q?: string;
    paymentStatus?: string;
    period?: string;
    page?: string;
  }>;
};

export default async function AdminOrdersPage({ searchParams }: OrdersPageProps) {
  const { q, paymentStatus, period, page } = await searchParams;
  const data = await listAdminOrders({
    page: page ? Number(page) : 1,
    search: q,
    paymentStatus: paymentStatus ?? "",
    period: period ?? "",
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Commandes"
        description="Supervision des transactions lecteurs, avec visibilite des formats ebook et papier en pending comme en paid."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Commandes" },
        ]}
      />

      {data.notices.length ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {data.notices.map((notice) => (
            <AdminNotice key={notice.id} tone={notice.tone} title={notice.title} description={notice.description} />
          ))}
        </div>
      ) : null}

      <AdminPanel title="Filtres" description="Recherche par utilisateur ou identifiant exact, filtre temporel et statut de paiement.">
        <AdminFilterBar action="/admin/orders">
          <AdminSearchInput defaultValue={q} placeholder="Email utilisateur ou UUID commande" />
          <AdminSelect
            name="paymentStatus"
            label="Paiement"
            defaultValue={paymentStatus}
            options={[
              { label: "pending", value: "pending" },
              { label: "paid", value: "paid" },
              { label: "failed", value: "failed" },
              { label: "refunded", value: "refunded" },
            ]}
          />
          <AdminSelect
            name="period"
            label="Periode"
            defaultValue={period}
            options={[
              { label: "7 derniers jours", value: "7d" },
              { label: "30 derniers jours", value: "30d" },
              { label: "90 derniers jours", value: "90d" },
              { label: "12 derniers mois", value: "365d" },
            ]}
          />
          <div className="flex gap-3">
            <button type="submit" className="cta-primary px-5 py-3 text-sm">
              Appliquer
            </button>
            <Link href="/admin/orders" className="cta-secondary px-5 py-3 text-sm">
              Reinitialiser
            </Link>
          </div>
        </AdminFilterBar>
      </AdminPanel>

      <AdminPanel title="Toutes les commandes" description="Vue consolidee orders + formats commandes (ebook, paperback, hardcover).">
        <AdminDataTable columns={["Commande", "Utilisateur", "Montant", "Statut", "Date", "Formats", "Items"]}>
          {data.items.map((order) => (
            <tr key={order.id} className="border-t border-violet-100/70">
              <td className="px-4 py-3">
                <Link href={`/admin/orders/${order.id}`} className="font-semibold text-slate-950 hover:text-violet-700">
                  {order.id.slice(0, 8)}
                </Link>
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">{order.user_name}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{formatMoney(order.total_price, order.currency_code)}</td>
              <td className="px-4 py-3">
                <StatusBadge kind="payment" value={order.payment_status} />
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">{formatAdminDateTime(order.created_at)}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {order.formatBreakdown.ebook > 0 ? (
                    <StatusBadge kind="format" value="ebook" label={`ebook x${order.formatBreakdown.ebook}`} />
                  ) : null}
                  {order.formatBreakdown.paperback > 0 ? (
                    <StatusBadge kind="format" value="paperback" label={`paperback x${order.formatBreakdown.paperback}`} />
                  ) : null}
                  {order.formatBreakdown.hardcover > 0 ? (
                    <StatusBadge kind="format" value="hardcover" label={`hardcover x${order.formatBreakdown.hardcover}`} />
                  ) : null}
                  {order.formatBreakdown.audiobook > 0 ? (
                    <StatusBadge kind="format" value="audiobook" label={`audiobook x${order.formatBreakdown.audiobook}`} />
                  ) : null}
                  {order.itemCount === 0 ? <span className="text-xs text-slate-400">-</span> : null}
                </div>
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-slate-950">{order.itemCount}</td>
            </tr>
          ))}
        </AdminDataTable>

        <div className="mt-4">
          <AdminPagination
            basePath="/admin/orders"
            pagination={data.pagination}
            params={{ q: q ?? "", paymentStatus: paymentStatus ?? "", period: period ?? "" }}
          />
        </div>
      </AdminPanel>
    </div>
  );
}
