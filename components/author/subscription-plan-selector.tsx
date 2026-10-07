"use client";

import { formatMoney } from "@/lib/book-offers";
import type { ApiSubscriptionPlan } from "@/types/api";

type SubscriptionPlanSelectorProps = {
  plans: ApiSubscriptionPlan[];
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
      <div className="rounded-md border border-dashed border-night-200 bg-night-50/60 px-4 py-4 text-sm text-slate-600">
        Aucun pack d’abonnement actif n’est disponible pour le moment.
      </div>
    );
  }

  function togglePlan(planId: string) {
    if (disabled) return;
    onChange(
      selectedPlanIds.includes(planId)
        ? selectedPlanIds.filter((selectedId) => selectedId !== planId)
        : [...selectedPlanIds, planId],
    );
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
            className={`rounded-md border px-4 py-4 text-left transition ${
              selected
                ? "border-night-600 bg-night-50 text-slate-900 "
                : "border-night-100 bg-white text-slate-700 hover:border-night-300 hover:bg-night-50/50"
            } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{plan.name}</p>
                <p className="mt-1 text-xs text-slate-500">{plan.slug}</p>
              </div>
              <span className={`rounded-sm px-2.5 py-1 text-[11px] font-semibold ${selected ? "bg-night-600 text-white" : "bg-paper-deep text-slate-600"}`}>
                {selected ? "Sélectionné" : formatMoney(Number(plan.monthly_price), plan.currency_code)}
              </span>
            </div>
            {plan.description ? <p className="mt-3 text-sm leading-6 text-slate-600">{plan.description}</p> : null}
          </button>
        );
      })}
    </div>
  );
}
