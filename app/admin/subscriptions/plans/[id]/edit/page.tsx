import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminSubscriptionPlanDetail } from "@/lib/supabase/admin/subscriptions";
import { saveSubscriptionPlanAction } from "@/app/admin/actions";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminPanel } from "@/components/admin/shared/admin-panel";

type PlanEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminSubscriptionPlanEditPage({ params }: PlanEditPageProps) {
  const { id } = await params;
  const data = await getAdminSubscriptionPlanDetail(id);

  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Editer: ${data.plan.name}`}
        description="Edition serveur des metadonnees du plan d abonnement."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Plans Premium", href: "/admin/subscriptions/plans" },
          { label: data.plan.name, href: `/admin/subscriptions/plans/${data.plan.id}` },
          { label: "Edition" },
        ]}
      />

      <form action={saveSubscriptionPlanAction}>
        <input type="hidden" name="plan_id" value={data.plan.id} />
        <input type="hidden" name="redirect_to" value={`/admin/subscriptions/plans/${data.plan.id}`} />
        <AdminPanel title="Plan" description="Nom, slug, pricing et activation du plan.">
          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Nom</span>
              <input type="text" name="name" defaultValue={data.plan.name} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Slug</span>
              <input type="text" name="slug" defaultValue={data.plan.slug} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Description</span>
              <textarea name="description" defaultValue={data.plan.description ?? ""} rows={6} className="rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm text-slate-900" />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Prix mensuel</span>
                <input type="number" step="0.01" name="monthly_price" defaultValue={data.plan.monthly_price} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Devise</span>
                <input type="text" name="currency_code" defaultValue={data.plan.currency_code} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
              </label>
            </div>
            <label className="flex items-center gap-3 rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm text-slate-700">
              <input type="checkbox" name="is_active" defaultChecked={data.plan.is_active} />
              Activer ce plan
            </label>
            <div className="flex gap-3">
              <button type="submit" className="cta-primary px-5 py-3 text-sm">
                Enregistrer
              </button>
              <Link href={`/admin/subscriptions/plans/${data.plan.id}`} className="cta-secondary px-5 py-3 text-sm">
                Annuler
              </Link>
            </div>
          </div>
        </AdminPanel>
      </form>
    </div>
  );
}
