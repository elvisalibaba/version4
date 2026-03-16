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
    <section className={`rounded-[1.9rem] border border-violet-200/70 bg-white/90 p-5 shadow-[0_20px_44px_rgba(89,68,219,0.08)] ${className}`.trim()}>
      {title || description || actions ? (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            {title ? <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">{title}</h2> : null}
            {description ? <p className="max-w-3xl text-sm leading-6 text-slate-500">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
