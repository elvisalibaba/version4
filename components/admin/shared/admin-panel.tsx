import type { ReactNode } from "react";

type AdminPanelProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function AdminPanel({ title, description, actions, children, className = "" }: AdminPanelProps) {
  return (
    <section
      className={`min-w-0 rounded-[1.35rem] border border-[#e6dccd] bg-white/92 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.05)] sm:rounded-[1.9rem] sm:p-5 sm:shadow-[0_20px_44px_rgba(15,23,42,0.06)] ${className}`.trim()}
    >
      {title || description || actions ? (
        <div className="mb-4 flex flex-col items-stretch gap-3 sm:mb-5 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 space-y-1">
            {title ? (
              <h2 className="break-words text-lg font-semibold tracking-[-0.03em] text-slate-950 sm:text-xl">{title}</h2>
            ) : null}
            {description ? <p className="max-w-3xl text-sm leading-6 text-slate-600">{description}</p> : null}
          </div>
          {actions ? (
            <div className="flex w-full flex-col gap-2 [&>a]:w-full [&>button]:w-full sm:w-auto sm:flex-row sm:flex-wrap sm:gap-3 sm:[&>a]:w-auto sm:[&>button]:w-auto">
              {actions}
            </div>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
