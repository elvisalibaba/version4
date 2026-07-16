import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  description?: string;
  tone?: "violet" | "sky" | "emerald" | "amber" | "rose" | "slate";
};

const toneClasses = {
  violet: "bg-[#f4efff] text-[#5b49df]",
  sky: "bg-[#edf6fb] text-[#3d6f83]",
  emerald: "bg-[#edf7f0] text-[#2f6f4f]",
  amber: "bg-[#fff3e2] text-[#a06a2b]",
  rose: "bg-[#fff0eb] text-[#b45b48]",
  slate: "bg-[#f3f1ee] text-[#5c544b]",
};

export function StatCard({ icon: Icon, label, value, description, tone = "violet" }: StatCardProps) {
  return (
    <article className="rounded-[20px] border border-[#e7ddd1] bg-white/95 p-3.5 shadow-[0_18px_40px_rgba(15,23,42,0.05)] sm:rounded-[26px] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-3">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#8b8177]">{label}</p>
          <p className="break-words text-[1.55rem] font-semibold tracking-[-0.04em] text-[#171717] sm:text-[1.9rem]">{value}</p>
          {description ? <p className="text-xs leading-5 text-[#6f665e] sm:text-sm sm:leading-6">{description}</p> : null}
        </div>
        <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
}
