import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  description?: string;
  tone?: "violet" | "sky" | "emerald" | "amber" | "rose" | "slate";
};

const toneClasses = {
  violet: "bg-[#f8efe7] text-[#a85b3f]",
  sky: "bg-[#edf4f7] text-[#3d6f83]",
  emerald: "bg-[#eef5ef] text-[#47725a]",
  amber: "bg-[#faf1e1] text-[#a06a2b]",
  rose: "bg-[#fde9e3] text-[#b45b48]",
  slate: "bg-[#f2f0ec] text-[#5c544b]",
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
