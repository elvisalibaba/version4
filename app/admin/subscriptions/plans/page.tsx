import Link from "next/link";
import { formatMoney } from "@/lib/book-offers";
import { listAdminSubscriptionPlans } from "@/lib/supabase/admin/subscriptions";
import { formatAdminDateTime } from "@/lib/supabase/admin/shared";
import { AdminFilterBar } from "@/components/admin/filters/admin-filter-bar";
import { AdminSearchInput } from "@/components/admin/filters/admin-search-input";
import { AdminSelect } from "@/components/admin/filters/admin-select";
import { AdminDataTable } from "@/components/admin/tables/admin-data-table";
import { AdminPagination } from "@/components/admin/tables/admin-pagination";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminPanel } from "@/components/admin/shared/admin-panel";
import { StatusBadge } from "@/components/admin/shared/status-badge";

type PlansPageProps = {
  searchParams: Promise<{
    q?: string;
    isActive?: string;
    page?: string;
  }>;
};

export default async function AdminSubscriptionPlansPage({ searchParams }: PlansPageProps) {
  const { q, isActive, page } = await searchParams;
  const data = await listAdminSubscriptionPlans({
    page: page ? Number(page) : 1,
    search: q,
    isActive: isActive ?? "",
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Plans Premium"
        description="Gestion des plans d abonnement, de leur activation et des livres actuellement inclus."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Plans Premium" },
        ]}
        actions={
          <Link href="/admin/subscriptions/plans/new" className="cta-primary px-5 py-3 text-sm">
            Nouveau plan
          </Link>
        }
      />

      <AdminPanel title="Filtres" description="Recherche par nom, slug ou description.">
        <AdminFilterBar action="/admin/subscriptions/plans">
          <AdminSearchInput defaultValue={q} placeholder="Nom, slug ou description" />
          <AdminSelect
            name="isActive"
            label="Etat"
            defaultValue={isActive}
            options={[
              { label: "Actif", value: "true" },
              { label: "Inactif", value: "false" },
            ]}
          />
          <div className="flex gap-3">
            <button type="submit" className="cta-primary px-5 py-3 text-sm">
              Appliquer
            </button>
            <Link href="/admin/subscriptions/plans" className="cta-secondary px-5 py-3 text-sm">
              Reinitialiser
            </Link>
          </div>
        </AdminFilterBar>
      </AdminPanel>

      <AdminPanel title="Catalogue des plans" description="Chaque ligne croise prix mensuel, nombre de livres inclus et nombre d abonnes.">
        <AdminDataTable columns={["Plan", "Prix", "Etat", "Livres", "Abonnes", "Dates"]}>
          {data.items.map((plan) => (
            <tr key={plan.id} className="border-t border-violet-100/70">
              <td className="px-4 py-3">
                <Link href={`/admin/subscriptions/plans/${plan.id}`} className="font-semibold text-slate-950 hover:text-violet-700">
                  {plan.name}
                </Link>
                <p className="text-sm text-slate-500">{plan.slug}</p>
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">{formatMoney(plan.monthly_price, plan.currency_code)}</td>
              <td className="px-4 py-3">
                <StatusBadge kind="boolean" value={plan.is_active} label={plan.is_active ? "Actif" : "Inactif"} />
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">{plan.includedBooksCount}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{plan.subscribersCount}</td>
              <td className="px-4 py-3 text-sm text-slate-500">
                Cree: {formatAdminDateTime(plan.created_at)}
                <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Maj: {formatAdminDateTime(plan.updated_at)}</div>
              </td>
            </tr>
          ))}
        </AdminDataTable>

        <div className="mt-4">
          <AdminPagination basePath="/admin/subscriptions/plans" pagination={data.pagination} params={{ q: q ?? "", isActive: isActive ?? "" }} />
        </div>
      </AdminPanel>
    </div>
  );
}
