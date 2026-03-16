"use client";

import { formatMoney } from "@/lib/book-offers";
import type { Database } from "@/types/database";

type SubscriptionPlan = Pick<
  Database["public"]["Tables"]["subscription_plans"]["Row"],
  "id" | "name" | "slug" | "description" | "monthly_price" | "currency_code" | "is_active"
>;

type SubscriptionPlanSelectorProps = {
  plans: SubscriptionPlan[];
  selectedPlanIds: string[];
  disabled?: boolean;
  onChange: (nextPlanIds: string[]) => void;
};

export function SubscriptionPlanSelector({
  plans,
  selectedPlanIds,
  disabled = false,
  onChange,
}: SubscriptionPlanSelectorProps) {
  if (plans.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-violet-200 bg-violet-50/60 px-4 py-4 text-sm text-slate-600">
        Aucun pack d abonnement actif n est disponible pour le moment.
      </div>
    );
  }

  function togglePlan(planId: string) {
    if (disabled) return;

    const nextPlanIds = selectedPlanIds.includes(planId)
      ? selectedPlanIds.filter((selectedId) => selectedId !== planId)
      : [...selectedPlanIds, planId];

    onChange(nextPlanIds);
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {plans.map((plan) => {
        const selected = selectedPlanIds.includes(plan.id);

        return (
          <button
            key={plan.id}
            type="button"
            disabled={disabled}
            onClick={() => togglePlan(plan.id)}
            className={`rounded-2xl border px-4 py-4 text-left transition ${
              selected
                ? "border-indigo-600 bg-indigo-50 text-slate-900 shadow-sm"
                : "border-violet-100 bg-white text-slate-700 hover:border-indigo-300 hover:bg-violet-50/50"
            } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{plan.name}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{plan.slug}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  selected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {selected ? "Selectionne" : formatMoney(plan.monthly_price, plan.currency_code)}
              </span>
            </div>
            {plan.description ? <p className="mt-3 text-sm leading-6 text-slate-600">{plan.description}</p> : null}
          </button>
        );
      })}
    </div>
  );
}
