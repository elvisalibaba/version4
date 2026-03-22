import Link from "next/link";
import { ArrowRight, Crown, Library, Sparkles } from "lucide-react";
import { DashboardTopbar } from "@/components/ui/dashboard-topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { getSubscriptionStatusLabel } from "@/lib/access-labels";
import { formatMoney } from "@/lib/book-offers";
import { requireRole } from "@/lib/auth";
import { isSubscriptionCurrentlyActive } from "@/lib/book-access";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type MaybeArray<T> = T | T[] | null;

type SubscriptionPlanRow = Pick<
  Database["public"]["Tables"]["subscription_plans"]["Row"],
  "id" | "name" | "slug" | "description" | "monthly_price" | "currency_code" | "is_active"
> & {
  subscription_plan_books: { id: string }[] | null;
};

type UserSubscriptionRow = Pick<
  Database["public"]["Tables"]["user_subscriptions"]["Row"],
  "id" | "status" | "started_at" | "expires_at"
> & {
  subscription_plans: MaybeArray<Pick<Database["public"]["Tables"]["subscription_plans"]["Row"], "id" | "name" | "slug">>;
};

function firstOf<T>(value: MaybeArray<T>) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function ReaderSubscriptionsPage() {
  const profile = await requireRole(["reader"]);
  const supabase = await createClient();

  const [{ data: plans }, { data: subscriptions }] = await Promise.all([
    supabase
      .from("subscription_plans")
      .select("id, name, slug, description, monthly_price, currency_code, is_active, subscription_plan_books(id)")
      .eq("is_active", true)
      .order("monthly_price", { ascending: true })
      .returns<SubscriptionPlanRow[]>(),
    supabase
      .from("user_subscriptions")
      .select("id, status, started_at, expires_at, subscription_plans!user_subscriptions_plan_id_fkey(id, name, slug)")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .returns<UserSubscriptionRow[]>(),
  ]);

  const activeSubscriptions = (subscriptions ?? []).filter((subscription) => isSubscriptionCurrentlyActive(subscription));

  return (
    <section className="space-y-6">
      <DashboardTopbar
        kicker="Premium"
        title="Mes abonnements"
        description="Consultez vos packs Premium et les formules disponibles. L activation reste pilotee par vos donnees Supabase tant que le paiement n est pas integre."
        actions={
          <>
            <Link href="/dashboard/reader/library" className="cta-primary px-5 py-3 text-sm">
              <Library className="h-4 w-4" />
              Retour a la bibliotheque
            </Link>
            <Link href="/books" className="cta-secondary px-5 py-3 text-sm">
              Explorer les livres
              <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {activeSubscriptions.length > 0 ? (
          activeSubscriptions.map((subscription) => {
            const plan = firstOf(subscription.subscription_plans);
            return (
              <article key={subscription.id} className="surface-panel-soft p-5">
                <p className="section-kicker">Plan actif</p>
                <h2 className="mt-4 text-2xl font-semibold text-slate-950">{plan?.name ?? "Premium"}</h2>
                <p className="mt-2 text-sm text-slate-500">{plan?.slug ?? "premium"}</p>
                <p className="mt-4 text-sm text-slate-600">Demarre le {new Date(subscription.started_at).toLocaleDateString("fr-FR")}</p>
              </article>
            );
          })
        ) : (
          <div className="md:col-span-2 xl:col-span-3">
            <EmptyState title="Aucun abonnement actif" description="Les packs Premium actifs apparaitront ici des qu ils seront rattaches a votre compte." />
          </div>
        )}
      </div>

      <section className="surface-panel p-6">
        <div className="section-header">
          <div className="space-y-2">
            <p className="section-kicker">Plans</p>
            <h2 className="section-title text-2xl">Packs disponibles</h2>
            <p className="section-description">Plans actifs exposes par Supabase.</p>
          </div>
          <span className="catalog-badge">{plans?.length ?? 0} packs</span>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {(plans ?? []).map((plan) => {
            const matchingSubscriptions = (subscriptions ?? []).filter((subscription) => firstOf(subscription.subscription_plans)?.id === plan.id);
            const currentSubscription =
              matchingSubscriptions.find((subscription) => isSubscriptionCurrentlyActive(subscription)) ?? matchingSubscriptions[0];
            const isActive = isSubscriptionCurrentlyActive(currentSubscription ?? null);

            return (
              <article key={plan.id} className="rounded-[1.75rem] border border-violet-100 bg-[linear-gradient(135deg,_rgba(255,255,255,0.95),_rgba(244,239,255,0.92))] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{plan.slug}</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-950">{plan.name}</h3>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {isActive ? "Actif" : currentSubscription ? getSubscriptionStatusLabel(currentSubscription.status) : "Disponible"}
                  </span>
                </div>
                <p className="mt-4 text-3xl font-bold text-slate-950">{formatMoney(plan.monthly_price, plan.currency_code)}</p>
                <p className="mt-1 text-sm text-slate-500">{plan.subscription_plan_books?.length ?? 0} livre(s) actuellement relies a ce pack</p>
                {plan.description ? <p className="mt-4 text-sm leading-7 text-slate-600">{plan.description}</p> : null}
                <div className="mt-5 rounded-[1.35rem] bg-white px-4 py-3 text-sm text-slate-600">
                  {isActive ? "Ce plan vous donne deja acces aux livres qui lui sont rattaches." : "Plan visible et pret pour un futur parcours d activation."}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="surface-panel-soft p-6">
        <div className="flex items-start gap-3">
          <Crown className="mt-1 h-5 w-5 text-amber-400" />
          <div>
            <p className="section-kicker">
              <Sparkles className="h-3.5 w-3.5" />
              Etat actuel
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              La logique d acces Premium est maintenant connectee a `subscription_plans`, `subscription_plan_books` et `user_subscriptions`.
              L etape suivante consiste a brancher un vrai parcours de souscription et de paiement si vous voulez permettre l activation directe depuis l interface.
            </p>
          </div>
        </div>
      </section>
    </section>
  );
}
