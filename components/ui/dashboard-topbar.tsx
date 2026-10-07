import type { ReactNode } from "react";

type DashboardTopbarProps = {
  kicker?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function DashboardTopbar({ kicker, title, description, actions }: DashboardTopbarProps) {
  return (
    <div className="overflow-hidden rounded-md border border-rule-strong bg-white p-4 sm:rounded-md sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          {kicker ? (
            <p className="inline-flex w-fit items-center rounded-sm bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              {kicker}
            </p>
          ) : null}
          <div className="space-y-2">
            <h1 className="text-[1.65rem] font-semibold tracking-[-0.05em] text-slate-900 sm:text-[2.45rem]">{title}</h1>
            {description ? <p className="max-w-3xl text-sm leading-7 text-slate-600">{description}</p> : null}
          </div>
        </div>
        {actions ? <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">{actions}</div> : null}
      </div>
    </div>
  );
}
