import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  description?: string;
  tone?: "violet" | "sky" | "emerald" | "amber" | "rose" | "slate";
};

const toneClasses = {
  violet: "bg-violet-100 text-violet-700",
  sky: "bg-sky-100 text-sky-700",
  emerald: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  rose: "bg-rose-100 text-rose-700",
  slate: "bg-slate-100 text-slate-700",
};

export function StatCard({ icon: Icon, label, value, description, tone = "violet" }: StatCardProps) {
  return (
    <article className="metric-card">
      <div className={`metric-icon ${toneClasses[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
        <p className="text-3xl font-semibold text-slate-950">{value}</p>
        {description ? <p className="text-sm text-slate-500">{description}</p> : null}
      </div>
    </article>
  );
}
