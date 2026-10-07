import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-900">{title}</h3>
        <p className="text-sm leading-7 text-slate-600">{description}</p>
      </div>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
