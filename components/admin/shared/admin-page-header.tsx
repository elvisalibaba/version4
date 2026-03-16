import type { ReactNode } from "react";
import { AdminBreadcrumbs } from "@/components/admin/shared/admin-breadcrumbs";

type AdminPageHeaderProps = {
  title: string;
  description: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: ReactNode;
};

export function AdminPageHeader({ title, description, breadcrumbs, actions }: AdminPageHeaderProps) {
  return (
    <header className="overflow-hidden rounded-[2rem] border border-violet-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(193,183,255,0.38),_transparent_24%),linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(247,242,255,0.94))] p-6 shadow-[0_22px_52px_rgba(89,68,219,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-4xl space-y-3">
          {breadcrumbs?.length ? <AdminBreadcrumbs items={breadcrumbs} /> : null}
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">{title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500 sm:text-base">{description}</p>
          </div>
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </header>
  );
}
