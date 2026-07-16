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
        <h2 className="section-title text-xl tracking-tight sm:text-[1.85rem]">{title}</h2>
        {description ? <p className="section-description max-w-3xl">{description}</p> : null}
      </div>
      {action ? <div className="section-action">{action}</div> : null}
    </div>
  );
}
