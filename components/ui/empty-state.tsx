import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state-card">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
        <p className="text-sm leading-6 text-slate-500">{description}</p>
      </div>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
