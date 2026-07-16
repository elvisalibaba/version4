"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  Compass,
  LayoutPanelTop,
  ShieldCheck,
  Sparkles,
  Store,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
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
  theme?: "reader" | "author";
  children: React.ReactNode;
};

const themeMeta = {
  reader: {
    workspaceLabel: "Reader Console",
    workspaceTone: "bg-[#fff3d6] text-[#9a5a00]",
    insightTitle: "Parcours de lecture",
    insightCopy:
      "Retrouve rapidement tes achats, tes acces Premium et tes titres en cours depuis une console plus lisible.",
    bullets: ["Bibliotheque centralisee", "Achats et Premium reunis", "Raccourcis vers le catalogue"],
    primaryShortcut: { href: "/dashboard/reader/library", label: "Ma bibliotheque" },
    secondaryShortcut: { href: "/dashboard/reader/subscriptions", label: "Mes abonnements" },
  },
  author: {
    workspaceLabel: "Publishing Console",
    workspaceTone: "bg-[#dff1ff] text-[#0f5f93]",
    insightTitle: "Pilotage auteur",
    insightCopy:
      "Organise ton catalogue, suis les ventes et avance titre par titre dans une experience plus proche d une console KDP.",
    bullets: ["Catalogue plus actionnable", "Pipeline de publication visible", "Ventes et audience mieux priorisees"],
    primaryShortcut: { href: "/dashboard/author/books", label: "Mon catalogue" },
    secondaryShortcut: { href: "/dashboard/author/add-book", label: "Publier un titre" },
  },
} as const;

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
  theme = "reader",
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const meta = themeMeta[theme];
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((value) => value[0])
    .join("")
    .toUpperCase();

  return (
    <div className="grid gap-3 pb-5 sm:gap-6 sm:pb-8 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="min-w-0 self-start rounded-[24px] border border-[#e5ddd1] bg-[radial-gradient(circle_at_top_left,rgba(255,153,0,0.12),transparent_24%),radial-gradient(circle_at_top_right,rgba(20,110,180,0.10),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,244,237,0.96))] p-3 shadow-[0_18px_44px_rgba(15,23,42,0.06)] sm:rounded-[32px] sm:p-4 sm:shadow-[0_28px_70px_rgba(15,23,42,0.08)] xl:sticky xl:top-24">
        <div className="flex items-center justify-between gap-3 xl:hidden">
          <Link href="/home" className="flex min-w-0 items-center gap-2.5" aria-label="Retour au site Holistique Books">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#171717] text-xs font-bold text-white">HB</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-[#171717]">{userName}</span>
              <span className="block text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#a85b3f]">{meta.workspaceLabel}</span>
            </span>
          </Link>
          <LogoutButton
            compact
            label="Se déconnecter"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#e5ddd1] bg-white text-[#4f4740] transition hover:border-[#ccbba7] hover:text-[#171717] disabled:opacity-60"
          />
        </div>

        <Link href="/home" className="hidden items-center gap-3 rounded-[24px] border border-[#ece4d8] bg-white/92 p-3 transition hover:border-[#cdbca9] xl:flex">
          <span className="grid h-11 w-11 place-items-center rounded-[16px] bg-[linear-gradient(135deg,#111827,#0f172a)] text-sm font-semibold text-white shadow-[0_16px_28px_rgba(15,23,42,0.18)]">
            HB
          </span>
          <span className="min-w-0">
            <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#b96e12]">Holistique</span>
            <span className="block truncate text-lg font-semibold tracking-[-0.03em] text-[#171717]">Books Console</span>
          </span>
        </Link>

        <div className="mt-4 hidden rounded-[20px] border border-[#ece4d8] bg-white/92 p-3.5 sm:block sm:rounded-[26px] sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#b96e12]">{areaLabel}</p>
            <span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] ${meta.workspaceTone}`}>
              {meta.workspaceLabel}
            </span>
          </div>
          <p className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[#171717] sm:mt-3 sm:text-[1.45rem]">{headline}</p>
          <p className="mt-2 hidden text-sm leading-7 text-[#6f665e] sm:block">{description}</p>
        </div>

        <div className="mt-4 hidden rounded-[26px] border border-[#ece4d8] bg-[#fffaf3] p-4 sm:block">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#111827,#1f2937)] text-sm font-semibold text-white">
              {initials || "HB"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#171717]">{userName}</p>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#8b8177]">{userRole}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#e9f7ee] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#237a43]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Session active
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#6f665e] ring-1 ring-[#ece4d8]">
              Supabase connecte
            </span>
          </div>
        </div>

        <nav
          aria-label={`Navigation ${userRole.toLowerCase()}`}
          className="-mr-3 mt-3 hidden gap-2 overflow-x-auto pb-1 pr-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex sm:pr-0 xl:mr-0 xl:mt-4 xl:grid xl:overflow-visible xl:pb-0"
        >
          {navigation.map((item) => {
            const active = isActive(pathname, item);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 shrink-0 items-center gap-2 rounded-[16px] border px-3.5 py-2.5 text-sm font-medium transition xl:w-full xl:gap-3 xl:rounded-[20px] xl:px-4 xl:py-3 ${
                  active
                    ? "border-[#171717] bg-[#171717] text-white shadow-[0_18px_36px_rgba(15,23,42,0.16)]"
                    : "border-[#ece4d8] bg-white/92 text-[#4f4740] hover:border-[#ccbba7] hover:bg-white hover:text-[#171717]"
                }`}
              >
                <DashboardIcon name={item.icon} className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 hidden gap-3 rounded-[24px] border border-[#ece4d8] bg-white/92 p-4 xl:grid">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff1db] text-[#c06d00]">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#171717]">{meta.insightTitle}</p>
              <p className="mt-1 text-sm leading-6 text-[#6f665e]">{meta.insightCopy}</p>
            </div>
          </div>
          <div className="grid gap-2">
            {meta.bullets.map((bullet) => (
              <div key={bullet} className="rounded-[18px] border border-[#efe6db] bg-[#fbf8f2] px-3 py-2 text-sm text-[#4f4740]">
                {bullet}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 hidden gap-3 rounded-[24px] border border-[#ece4d8] bg-white/92 p-4 xl:grid">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e9f3fb] text-[#146eb4]">
              <LayoutPanelTop className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#171717]">Raccourcis</p>
              <p className="mt-1 text-sm leading-6 text-[#6f665e]">
                Passe rapidement du workspace au catalogue public sans quitter ta console.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={meta.primaryShortcut.href}
              className="inline-flex items-center gap-2 rounded-full border border-[#e5ddd1] bg-[#fff7ea] px-4 py-2 text-xs font-semibold text-[#26221d] transition hover:border-[#ccbba7] hover:bg-white"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              {meta.primaryShortcut.label}
            </Link>
            <Link
              href={meta.secondaryShortcut.href}
              className="inline-flex items-center gap-2 rounded-full border border-[#e5ddd1] bg-white px-4 py-2 text-xs font-semibold text-[#26221d] transition hover:border-[#ccbba7]"
            >
              <Store className="h-3.5 w-3.5" />
              {meta.secondaryShortcut.label}
            </Link>
            <Link
              href="/books"
              className="inline-flex items-center gap-2 rounded-full border border-[#e5ddd1] bg-white px-4 py-2 text-xs font-semibold text-[#26221d] transition hover:border-[#ccbba7]"
            >
              <Compass className="h-3.5 w-3.5" />
              Catalogue
            </Link>
            <Link
              href="/home"
              className="inline-flex items-center gap-2 rounded-full border border-[#e5ddd1] bg-white px-4 py-2 text-xs font-semibold text-[#26221d] transition hover:border-[#ccbba7]"
            >
              <LayoutPanelTop className="h-3.5 w-3.5" />
              Site public
            </Link>
          </div>
          <LogoutButton className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#171717] bg-[#171717] px-4 text-sm font-semibold text-white transition hover:bg-[#0f172a] disabled:cursor-not-allowed disabled:opacity-70" />
        </div>
      </aside>

      <div className="min-w-0 space-y-4 sm:space-y-6">
        <section className="hidden rounded-[22px] border border-[#e5ddd1] bg-[radial-gradient(circle_at_top_left,rgba(255,153,0,0.10),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,244,237,0.95))] p-3 shadow-[0_18px_38px_rgba(15,23,42,0.05)] sm:rounded-[30px] sm:p-4 sm:shadow-[0_22px_50px_rgba(15,23,42,0.05)] lg:block">
          <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] ${meta.workspaceTone}`}>
                {meta.workspaceLabel}
              </span>
              <span className="rounded-full border border-[#e7dfd3] bg-white px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#6f665e]">
                {userRole}
              </span>
              <span className="hidden rounded-full border border-[#d9eadf] bg-[#eefaf2] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#237a43] sm:inline-flex">
                Workflow propre
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <Link
                href={meta.primaryShortcut.href}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#ff9900] px-3 text-xs font-semibold text-[#171717] transition hover:bg-[#f08f00] sm:h-10 sm:min-h-0 sm:rounded-full sm:px-4 sm:text-sm"
              >
                <ArrowUpRight className="h-4 w-4" />
                {meta.primaryShortcut.label}
              </Link>
              <Link
                href="/home"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#e5ddd1] bg-white px-3 text-xs font-semibold text-[#26221d] transition hover:border-[#ccbba7] sm:h-10 sm:min-h-0 sm:rounded-full sm:px-4 sm:text-sm"
              >
                <Compass className="h-4 w-4" />
                Voir le site
              </Link>
            </div>
          </div>
        </section>

        {children}
      </div>

      <nav
        aria-label={`Navigation mobile ${userRole.toLowerCase()}`}
        className="fixed inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-50 flex gap-1 overflow-x-auto rounded-[1.2rem] border border-[#ddd2c4] bg-[#fffdf9]/96 p-1.5 shadow-[0_18px_48px_rgba(15,23,42,0.20)] backdrop-blur-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:hidden"
      >
        {navigation.map((item) => {
          const active = isActive(pathname, item);

          return (
            <Link
              key={`mobile-${item.href}`}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-14 min-w-[4.5rem] flex-1 flex-col items-center justify-center gap-1 rounded-[0.9rem] px-2 text-center text-[0.62rem] font-bold leading-tight transition ${
                active ? "bg-[#171717] text-white" : "text-[#6f665e] hover:bg-[#f5eee5] hover:text-[#171717]"
              }`}
            >
              <DashboardIcon name={item.icon} className="h-4 w-4" />
              <span className="max-w-[5rem] truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
