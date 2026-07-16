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
    <header className="min-w-0 overflow-hidden rounded-[1.35rem] border border-[#e6dccd] bg-[radial-gradient(circle_at_top_left,_rgba(255,153,0,0.14),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(20,110,180,0.10),_transparent_24%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,244,237,0.94))] p-4 shadow-[0_16px_38px_rgba(15,23,42,0.05)] sm:rounded-[2rem] sm:p-6 sm:shadow-[0_22px_52px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-5">
        <div className="min-w-0 max-w-4xl space-y-2.5 sm:space-y-3">
          {breadcrumbs?.length ? <AdminBreadcrumbs items={breadcrumbs} /> : null}
          <div>
            <h1 className="break-words text-[1.75rem] font-semibold leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-4xl">
              {title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:mt-3 sm:text-base sm:leading-7">
              {description}
            </p>
          </div>
        </div>
        {actions ? (
          <div className="flex w-full flex-col gap-2 [&>a]:w-full [&>button]:w-full sm:w-auto sm:flex-row sm:flex-wrap sm:gap-3 sm:[&>a]:w-auto sm:[&>button]:w-auto">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
