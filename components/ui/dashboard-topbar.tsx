import type { ReactNode } from "react";

type DashboardTopbarProps = {
  kicker?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function DashboardTopbar({ kicker, title, description, actions }: DashboardTopbarProps) {
  return (
    <div className="flex flex-col gap-5 rounded-[30px] border border-[#e7ddd1] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,245,239,0.96))] p-5 shadow-[0_24px_60px_rgba(15,23,42,0.06)] lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-3">
        {kicker ? (
          <p className="inline-flex w-fit items-center rounded-full bg-[#fff1ea] px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#a85b3f]">
            {kicker}
          </p>
        ) : null}
        <div className="space-y-2">
          <h1 className="text-[1.9rem] font-semibold tracking-[-0.05em] text-[#171717] sm:text-[2.35rem]">{title}</h1>
          {description ? <p className="max-w-3xl text-sm leading-7 text-[#6f665e]">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
