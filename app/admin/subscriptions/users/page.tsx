import Link from "next/link";
import { listAdminUserSubscriptions, getAdminSubscriptionEditorOptions } from "@/lib/supabase/admin/subscriptions";
import { formatAdminDateTime } from "@/lib/supabase/admin/shared";
import { saveUserSubscriptionAction } from "@/app/admin/actions";
import { AdminFilterBar } from "@/components/admin/filters/admin-filter-bar";
import { AdminSearchInput } from "@/components/admin/filters/admin-search-input";
import { AdminSelect } from "@/components/admin/filters/admin-select";
import { AdminDataTable } from "@/components/admin/tables/admin-data-table";
import { AdminPagination } from "@/components/admin/tables/admin-pagination";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminPanel } from "@/components/admin/shared/admin-panel";
import { StatusBadge } from "@/components/admin/shared/status-badge";

type UserSubscriptionsPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: "active" | "cancelled" | "expired" | "past_due";
    planId?: string;
    userId?: string;
    page?: string;
  }>;
};

export default async function AdminUserSubscriptionsPage({ searchParams }: UserSubscriptionsPageProps) {
  const { q, status, planId, userId, page } = await searchParams;
  const [data, editorOptions] = await Promise.all([
    listAdminUserSubscriptions({
      page: page ? Number(page) : 1,
      search: q,
      status: status ?? "",
      planId: planId ?? "",
      userId: userId ?? "",
    }),
    getAdminSubscriptionEditorOptions(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Abonnements utilisateurs"
        description="Gestion des user_subscriptions, creation manuelle, prolongation et changements de statut."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Abonnements utilisateurs" },
        ]}
      />

      <AdminPanel title="Creer un abonnement manuel" description="Rattache un utilisateur a un plan dans les limites du schema actuel.">
        <form action={saveUserSubscriptionAction} className="grid gap-4 xl:grid-cols-5">
          <input type="hidden" name="redirect_to" value="/admin/subscriptions/users" />
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Utilisateur</span>
            <select name="user_id" className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900">
              {editorOptions.users.map((user) => (
                <option key={user.value} value={user.value}>
                  {user.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Plan</span>
            <select name="plan_id" className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900">
              {editorOptions.plans.map((plan) => (
                <option key={plan.value} value={plan.value}>
                  {plan.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Statut</span>
            <select name="status" defaultValue="active" className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900">
              <option value="active">active</option>
              <option value="cancelled">cancelled</option>
              <option value="expired">expired</option>
              <option value="past_due">past_due</option>
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Debut</span>
            <input type="datetime-local" name="started_at" className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
          </label>
          <div className="flex items-end">
            <button type="submit" className="cta-primary w-full px-5 py-3 text-sm">
              Creer
            </button>
          </div>
        </form>
      </AdminPanel>

      <AdminPanel title="Filtres" description="Recherche par utilisateur ou plan, avec filtres sur le statut.">
        <AdminFilterBar action="/admin/subscriptions/users">
          <AdminSearchInput defaultValue={q} placeholder="Email utilisateur ou nom de plan" />
          <AdminSelect
            name="status"
            label="Statut"
            defaultValue={status}
            options={[
              { label: "active", value: "active" },
              { label: "cancelled", value: "cancelled" },
              { label: "expired", value: "expired" },
              { label: "past_due", value: "past_due" },
            ]}
          />
          <AdminSelect name="planId" label="Plan" defaultValue={planId} options={editorOptions.plans} />
          <AdminSelect name="userId" label="Utilisateur" defaultValue={userId} options={editorOptions.users} />
          <div className="flex gap-3">
            <button type="submit" className="cta-primary px-5 py-3 text-sm">
              Appliquer
            </button>
            <Link href="/admin/subscriptions/users" className="cta-secondary px-5 py-3 text-sm">
              Reinitialiser
            </Link>
          </div>
        </AdminFilterBar>
      </AdminPanel>

      <AdminPanel title="Tous les abonnements utilisateurs" description="Edition inline du statut et de l expiration.">
        <AdminDataTable columns={["Utilisateur", "Plan", "Statut", "Debut", "Expiration", "Action"]}>
          {data.items.map((subscription) => (
            <tr key={subscription.id} className="border-t border-violet-100/70 align-top">
              <td className="px-4 py-3 text-sm text-slate-500">{subscription.user_name}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{subscription.plan_name}</td>
              <td className="px-4 py-3">
                <StatusBadge kind="subscription" value={subscription.status} />
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">{formatAdminDateTime(subscription.started_at)}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{formatAdminDateTime(subscription.expires_at)}</td>
              <td className="px-4 py-3">
                <form action={saveUserSubscriptionAction} className="grid gap-2">
                  <input type="hidden" name="subscription_id" value={subscription.id} />
                  <input type="hidden" name="user_id" value={subscription.user_id} />
                  <input type="hidden" name="plan_id" value={subscription.plan_id} />
                  <input type="hidden" name="started_at" value={subscription.started_at} />
                  <input type="hidden" name="redirect_to" value="/admin/subscriptions/users" />
                  <select name="status" defaultValue={subscription.status} className="min-h-10 rounded-xl border border-violet-200 bg-white px-3 text-sm text-slate-900">
                    <option value="active">active</option>
                    <option value="cancelled">cancelled</option>
                    <option value="expired">expired</option>
                    <option value="past_due">past_due</option>
                  </select>
                  <input type="datetime-local" name="expires_at" defaultValue={subscription.expires_at ? subscription.expires_at.slice(0, 16) : ""} className="min-h-10 rounded-xl border border-violet-200 bg-white px-3 text-sm text-slate-900" />
                  <button type="submit" className="cta-secondary px-4 py-2 text-xs">
                    Enregistrer
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </AdminDataTable>

        <div className="mt-4">
          <AdminPagination
            basePath="/admin/subscriptions/users"
            pagination={data.pagination}
            params={{ q: q ?? "", status: status ?? "", planId: planId ?? "", userId: userId ?? "" }}
          />
        </div>
      </AdminPanel>
    </div>
  );
}
