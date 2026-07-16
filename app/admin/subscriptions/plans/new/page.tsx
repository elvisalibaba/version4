import Link from "next/link";
import { saveSubscriptionPlanAction } from "@/app/admin/actions";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminPanel } from "@/components/admin/shared/admin-panel";

export default function AdminSubscriptionPlanNewPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Nouveau plan Premium"
        description="Creation d un plan d abonnement sans modifier le schema existant."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Plans Premium", href: "/admin/subscriptions/plans" },
          { label: "Nouveau plan" },
        ]}
      />

      <form action={saveSubscriptionPlanAction}>
        <input type="hidden" name="redirect_to" value="/admin/subscriptions/plans" />
        <AdminPanel title="Plan" description="Nom, slug, description, pricing et activation.">
          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Nom</span>
              <input type="text" name="name" className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Slug</span>
              <input type="text" name="slug" className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Description</span>
              <textarea name="description" rows={6} className="rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm text-slate-900" />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Prix mensuel</span>
                <input type="number" step="0.01" name="monthly_price" defaultValue="0" className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Devise</span>
                <input type="text" name="currency_code" defaultValue="USD" className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
              </label>
            </div>
            <label className="flex items-center gap-3 rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm text-slate-700">
              <input type="checkbox" name="is_active" defaultChecked />
              Activer ce plan
            </label>
            <div className="flex gap-3">
              <button type="submit" className="cta-primary px-5 py-3 text-sm">
                Creer le plan
              </button>
              <Link href="/admin/subscriptions/plans" className="cta-secondary px-5 py-3 text-sm">
                Annuler
              </Link>
            </div>
          </div>
        </AdminPanel>
      </form>
    </div>
  );
}
