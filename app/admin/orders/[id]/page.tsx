import Link from "next/link";
import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/book-offers";
import { getAdminOrderDetail } from "@/lib/supabase/admin/orders";
import { formatAdminDateTime } from "@/lib/supabase/admin/shared";
import { updateOrderStatusAction } from "@/app/admin/actions";
import { AdminDataTable } from "@/components/admin/tables/admin-data-table";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminPanel } from "@/components/admin/shared/admin-panel";
import { StatusBadge } from "@/components/admin/shared/status-badge";
import { AdminNotice } from "@/components/admin/shared/admin-notice";

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminOrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const data = await getAdminOrderDetail(id);

  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Commande ${data.order.id.slice(0, 8)}`}
        description="Detail d une commande, de ses lignes et de son statut de paiement, avec un point d extension explicite pour la synchronisation library."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Commandes", href: "/admin/orders" },
          { label: data.order.id.slice(0, 8) },
        ]}
      />

      {data.notices.length ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {data.notices.map((notice) => (
            <AdminNotice key={notice.id} tone={notice.tone} title={notice.title} description={notice.description} />
          ))}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <AdminPanel title="Commande" description="Metadonnees actuelles de orders.">
          <dl className="grid gap-4 text-sm">
            <div>
              <dt className="font-semibold text-slate-950">Utilisateur</dt>
              <dd className="text-slate-500">{data.order.user_name}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Montant</dt>
              <dd className="text-slate-500">{formatMoney(data.order.total_price, data.order.currency_code)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Creation</dt>
              <dd className="text-slate-500">{formatAdminDateTime(data.order.created_at)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Statut</dt>
              <dd className="mt-2">
                <StatusBadge kind="payment" value={data.order.payment_status} />
              </dd>
            </div>
          </dl>
        </AdminPanel>

        <AdminPanel title="Action admin" description="Toute modification de payment_status doit rester coherente avec le backend.">
          <form action={updateOrderStatusAction} className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
            <input type="hidden" name="order_id" value={data.order.id} />
            <input type="hidden" name="redirect_to" value={`/admin/orders/${data.order.id}`} />
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Nouveau statut</span>
              <select name="payment_status" defaultValue={data.order.payment_status} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900">
                <option value="pending">pending</option>
                <option value="paid">paid</option>
                <option value="failed">failed</option>
                <option value="refunded">refunded</option>
              </select>
            </label>
            <button type="submit" className="cta-primary self-end px-5 py-3 text-sm">
              Mettre a jour
            </button>
          </form>
        </AdminPanel>
      </div>

      <AdminPanel title="Lignes de commande" description="order_items relies a cette commande.">
        <AdminDataTable columns={["Livre", "Prix", "Devise"]}>
          {data.items.map((item) => (
            <tr key={item.id} className="border-t border-violet-100/70">
              <td className="px-4 py-3">
                <Link href={`/admin/books/${item.book_id}`} className="font-semibold text-slate-950 hover:text-violet-700">
                  {item.book_title}
                </Link>
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">{formatMoney(item.price, item.currency_code)}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{item.currency_code}</td>
            </tr>
          ))}
        </AdminDataTable>
      </AdminPanel>
    </div>
  );
}
