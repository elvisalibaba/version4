import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  description?: string;
  tone?: "violet" | "sky" | "emerald" | "amber" | "rose" | "slate";
};

const toneClasses = {
  violet: "bg-night-50 text-night-600",
  sky: "bg-night-50 text-night-600",
  emerald: "bg-emerald-50 text-night-900",
  amber: "bg-amber-50 text-amber-800",
  rose: "bg-slate-50 text-brand-600",
  slate: "bg-slate-100 text-slate-700",
};

export function StatCard({ icon: Icon, label, value, description, tone = "violet" }: StatCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white/95 p-3.5 shadow-md sm:rounded-xl sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500">{label}</p>
          <p className="break-words text-[1.55rem] font-semibold tracking-[-0.04em] text-slate-900 sm:text-[1.9rem]">{value}</p>
          {description ? <p className="text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">{description}</p> : null}
        </div>
        <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
}
