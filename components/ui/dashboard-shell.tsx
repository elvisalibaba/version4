"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, LayoutPanelTop } from "lucide-react";
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
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((value) => value[0])
    .join("")
    .toUpperCase();

  return (
    <div className="grid gap-6 pb-8 xl:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="self-start rounded-[30px] border border-[#e7ddd1] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,245,239,0.96))] p-4 shadow-[0_24px_60px_rgba(15,23,42,0.06)] xl:sticky xl:top-24">
        <Link href="/home" className="flex items-center gap-3 rounded-[24px] border border-[#ece3d7] bg-white/92 p-3 transition hover:border-[#d5c8bb]">
          <span className="grid h-11 w-11 place-items-center rounded-[16px] bg-[#171717] text-sm font-semibold text-white">HB</span>
          <span className="min-w-0">
            <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#a85b3f]">Holistique</span>
            <span className="block truncate text-lg font-semibold tracking-[-0.03em] text-[#171717]">Books Studio</span>
          </span>
        </Link>

        <div className="mt-4 rounded-[26px] border border-[#ece3d7] bg-white/92 p-5">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#a85b3f]">{areaLabel}</p>
          <h2 className="mt-3 text-[1.45rem] font-semibold tracking-[-0.04em] text-[#171717]">{headline}</h2>
          <p className="mt-2 text-sm leading-7 text-[#6f665e]">{description}</p>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-[24px] border border-[#ece3d7] bg-[#fff7f0] p-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#171717] text-sm font-semibold text-white">
            {initials || "HB"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#171717]">{userName}</p>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#8b8177]">{userRole}</p>
          </div>
        </div>

        <nav className="mt-4 grid gap-2">
          {navigation.map((item) => {
            const active = isActive(pathname, item);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-[20px] border px-4 py-3 text-sm font-medium transition ${
                  active
                    ? "border-[#171717] bg-[#171717] text-white"
                    : "border-[#ece3d7] bg-white/90 text-[#4f4740] hover:border-[#d5c8bb] hover:bg-[#fcfaf7] hover:text-[#171717]"
                }`}
              >
                <DashboardIcon name={item.icon} className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 grid gap-3 rounded-[24px] border border-[#ece3d7] bg-white/92 p-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff1ea] text-[#ff6a4c]">
              <LayoutPanelTop className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#171717]">Raccourcis</p>
              <p className="mt-1 text-sm leading-6 text-[#6f665e]">Garde un acces rapide au catalogue et au site public.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/books"
              className="inline-flex items-center gap-2 rounded-full border border-[#e7ddd1] bg-[#fcfaf7] px-4 py-2 text-xs font-semibold text-[#26221d] transition hover:border-[#d5c8bb] hover:bg-white"
            >
              <Compass className="h-3.5 w-3.5" />
              Catalogue
            </Link>
            <Link
              href="/home"
              className="inline-flex items-center gap-2 rounded-full border border-[#e7ddd1] bg-white px-4 py-2 text-xs font-semibold text-[#26221d] transition hover:border-[#d5c8bb]"
            >
              Site public
            </Link>
          </div>
        </div>
      </aside>

      <div className="min-w-0 space-y-6">{children}</div>
    </div>
  );
}
