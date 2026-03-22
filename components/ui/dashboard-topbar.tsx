import type { ReactNode } from "react";

type DashboardTopbarProps = {
  kicker?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function DashboardTopbar({ kicker, title, description, actions }: DashboardTopbarProps) {
  return (
    <div className="overflow-hidden rounded-[32px] border border-[#e5ddd1] bg-[radial-gradient(circle_at_top_left,rgba(255,153,0,0.12),transparent_24%),radial-gradient(circle_at_top_right,rgba(20,110,180,0.10),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,244,237,0.94))] p-6 shadow-[0_24px_58px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          {kicker ? (
            <p className="inline-flex w-fit items-center rounded-full bg-[#fff1db] px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#b96e12]">
              {kicker}
            </p>
          ) : null}
          <div className="space-y-2">
            <h1 className="text-[1.95rem] font-semibold tracking-[-0.05em] text-[#171717] sm:text-[2.45rem]">{title}</h1>
            {description ? <p className="max-w-3xl text-sm leading-7 text-[#6f665e]">{description}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </div>
  );
}
