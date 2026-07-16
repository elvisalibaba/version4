import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
  className?: string;
};

export function AppShell({ children, className = "" }: AppShellProps) {
  return <div className={`app-shell ${className}`.trim()}>{children}</div>;
}
