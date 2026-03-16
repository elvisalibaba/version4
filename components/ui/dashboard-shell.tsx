"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardIcon, type DashboardIconName } from "@/components/ui/dashboard-icons";

type DashboardNavigationItem = {
  href: string;
  label: string;
  icon: DashboardIconName;
  exact?: boolean;
};

type DashboardShellProps = {
  areaLabel: string;
  headline: string;
  description: string;
  userName: string;
  userRole: string;
  navigation: DashboardNavigationItem[];
  children: React.ReactNode;
};

function isActive(pathname: string, item: DashboardNavigationItem) {
  if (item.exact) {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function DashboardShell({
  areaLabel,
  headline,
  description,
  userName,
  userRole,
  navigation,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();

  return (
    <div className="dashboard-frame">
      <aside className="dashboard-sidebar">
        <Link href="/home" className="dashboard-brand">
          <span className="dashboard-brand-mark">HB</span>
          <span>
            <span className="block text-xs font-semibold uppercase tracking-[0.26em] text-violet-500">Holistique</span>
            <span className="block text-lg font-semibold text-slate-950">Books</span>
          </span>
        </Link>

        <div className="dashboard-profile">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-500">{areaLabel}</p>
          <h2 className="mt-3 text-xl font-semibold text-slate-950">{headline}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
          <div className="dashboard-profile-card">
            <div className="dashboard-avatar">{userName.slice(0, 2).toUpperCase()}</div>
            <div>
              <p className="text-sm font-semibold text-slate-950">{userName}</p>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{userRole}</p>
            </div>
          </div>
        </div>

        <nav className="dashboard-nav">
          {navigation.map((item) => {
            const active = isActive(pathname, item);

            return (
              <Link key={item.href} href={item.href} className={`dashboard-nav-link ${active ? "is-active" : ""}`.trim()}>
                <DashboardIcon name={item.icon} className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="dashboard-spotlight">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-500">Quick switch</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/books" className="cta-secondary px-4 py-2 text-xs">
              Catalogue
            </Link>
            <Link href="/home" className="cta-secondary px-4 py-2 text-xs">
              Site public
            </Link>
          </div>
        </div>
      </aside>

      <div className="dashboard-main">{children}</div>
    </div>
  );
}
