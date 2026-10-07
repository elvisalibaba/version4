import Link from "next/link";
import { Crown, Library, Sparkles } from "lucide-react";
import { DashboardTopbar } from "@/components/ui/dashboard-topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth";
import { getActivePlans, getReaderSubscriptions } from "@/lib/reader-api";

function money(value: number | string, currency: string) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value ?? 0));
}

export default async function ReaderSubscriptionsPage() {
  await requireRole(["reader"]);
  const [subscriptions, plans] = await Promise.all([getReaderSubscriptions(), getActivePlans()]);

  return (
    <section className="space-y-6">
      <DashboardTopbar kicker="Premium" title="Mes abonnements" description="Vos abonnements en cours et les formules disponibles." actions={<Link href="/dashboard/reader/library" className="cta-secondary px-5 py-3 text-sm"><Library className="h-4 w-4" /> Bibliothèque</Link>} />
      <section className="surface-panel p-6">
        <div className="section-header"><div><p className="section-kicker">Actifs et historiques</p><h2 className="section-title text-2xl">Mes formules</h2></div><Crown className="h-6 w-6 text-brand-600" /></div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {subscriptions.length ? subscriptions.map((subscription) => (
            <article key={subscription.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
              <span className="catalog-badge">{subscription.status}</span>
              <h3 className="mt-3 text-lg font-semibold">{subscription.plan?.name ?? "Abonnement"}</h3>
              <p className="mt-2 text-sm text-slate-600">Début : {new Date(subscription.started_at).toLocaleDateString("fr-FR")}</p>
              <p className="text-sm text-slate-600">Expiration : {subscription.expires_at ? new Date(subscription.expires_at).toLocaleDateString("fr-FR") : "Sans date définie"}</p>
            </article>
          )) : <EmptyState title="Aucun abonnement" description="Vous n’avez pas encore de formule Premium active." />}
        </div>
      </section>
      <section className="surface-panel p-6">
        <div className="section-header"><div><p className="section-kicker">Catalogue Premium</p><h2 className="section-title text-2xl">Plans disponibles</h2></div><Sparkles className="h-6 w-6 text-brand-600" /></div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => <article key={plan.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5"><h3 className="text-lg font-semibold">{plan.name}</h3><p className="mt-2 text-2xl font-bold">{money(plan.monthly_price, plan.currency_code)}</p><p className="mt-2 text-sm text-slate-600">{plan.description ?? "Accès Premium HolisticBooks."}</p></article>)}
        </div>
      </section>
    </section>
  );
}
