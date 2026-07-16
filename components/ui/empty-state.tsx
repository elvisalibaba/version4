import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-[26px] border border-dashed border-[#d8cdc0] bg-[#fbf7f2] p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold tracking-[-0.03em] text-[#171717]">{title}</h3>
        <p className="text-sm leading-7 text-[#6f665e]">{description}</p>
      </div>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
