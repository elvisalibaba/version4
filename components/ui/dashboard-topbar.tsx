import type { ReactNode } from "react";

type DashboardTopbarProps = {
  kicker?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function DashboardTopbar({ kicker, title, description, actions }: DashboardTopbarProps) {
  return (
    <div className="dashboard-topbar">
      <div className="space-y-2">
        {kicker ? <p className="section-kicker">{kicker}</p> : null}
        <h1 className="section-title text-3xl sm:text-4xl">{title}</h1>
        {description ? <p className="section-description max-w-3xl">{description}</p> : null}
      </div>
      {actions ? <div className="dashboard-topbar-actions">{actions}</div> : null}
    </div>
  );
}
