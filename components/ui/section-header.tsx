import type { ReactNode } from "react";

type SectionHeaderProps = {
  kicker?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function SectionHeader({ kicker, title, description, action }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <div className="space-y-2">
        {kicker ? <p className="section-kicker">{kicker}</p> : null}
        <h2 className="section-title text-2xl sm:text-3xl">{title}</h2>
        {description ? <p className="section-description max-w-3xl">{description}</p> : null}
      </div>
      {action ? <div className="section-action">{action}</div> : null}
    </div>
  );
}
