import type { LucideIcon } from "lucide-react";

type AdminKpiCardProps = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  trend?: string;
  tone?: "violet" | "sky" | "emerald" | "amber" | "rose";
};

const toneClasses = {
  violet: "bg-[#fff1db] text-[#b96e12]",
  sky: "bg-sky-100 text-sky-700",
  emerald: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  rose: "bg-rose-100 text-rose-700",
};

export function AdminKpiCard({ icon: Icon, label, value, hint, trend, tone = "violet" }: AdminKpiCardProps) {
  return (
    <article className="rounded-[1.75rem] border border-[#e6dccd] bg-white/92 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <div className={`grid h-11 w-11 place-items-center rounded-2xl ${toneClasses[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{label}</p>
        <p className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">{value}</p>
        {hint ? <p className="text-sm text-slate-500">{hint}</p> : null}
        {trend ? <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b96e12]">{trend}</p> : null}
      </div>
    </article>
  );
}
