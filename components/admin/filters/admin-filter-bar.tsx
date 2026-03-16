import type { ReactNode } from "react";

type AdminFilterBarProps = {
  children: ReactNode;
  action?: string;
};

export function AdminFilterBar({ children, action }: AdminFilterBarProps) {
  return (
    <form
      action={action}
      className="flex flex-wrap items-end gap-3 rounded-[1.6rem] border border-violet-200/70 bg-violet-50/60 p-4"
    >
      {children}
    </form>
  );
}
