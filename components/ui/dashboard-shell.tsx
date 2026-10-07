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
    workspaceLabel: "Espace lecteur",
    workspaceTone: "bg-amber-50 text-amber-800",
    insightTitle: "Parcours de lecture",
    insightCopy:
      "Retrouvez rapidement vos achats, vos accès Premium et vos titres en cours.",
    bullets: ["Bibliothèque centralisée", "Achats et Premium réunis", "Raccourcis vers le catalogue"],
    primaryShortcut: { href: "/dashboard/reader/library", label: "Ma bibliothèque" },
    secondaryShortcut: { href: "/dashboard/reader/subscriptions", label: "Mes abonnements" },
  },
  author: {
    workspaceLabel: "Espace auteur",
    workspaceTone: "bg-night-50 text-night-700",
    insightTitle: "Pilotage auteur",
    insightCopy:
      "Organisez votre catalogue, suivez vos ventes et avancez simplement, titre par titre.",
    bullets: ["Catalogue facile à gérer", "Étapes de publication visibles", "Ventes faciles à suivre"],
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
    <div className={`grid gap-3 pb-5 sm:gap-6 sm:pb-8 ${theme === "author" ? "xl:grid-cols-[250px_minmax(0,1fr)]" : "xl:grid-cols-[320px_minmax(0,1fr)]"}`}>
      <aside className={`min-w-0 self-start rounded-md border border-rule-strong p-3 sm:rounded-md sm:p-4 xl:sticky xl:top-24 ${theme === "author" ? "bg-paper " : "bg-white "}`}>
        <div className="flex items-center justify-between gap-3 xl:hidden">
          <Link href="/home" className="flex min-w-0 items-center gap-2.5" aria-label="Retour au site Holistique Books">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-night-900 text-xs font-bold text-white">HB</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-slate-900">{userName}</span>
              <span className="block text-xs font-bold text-brand-600">{meta.workspaceLabel}</span>
            </span>
          </Link>
          <LogoutButton
            compact
            label="Se déconnecter"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-rule-strong bg-white text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:opacity-60"
          />
        </div>

        <Link href="/home" className="hidden items-center gap-3 rounded-md border border-rule bg-white/92 p-3 transition hover:border-slate-400 xl:flex">
          <span className="grid h-11 w-11 place-items-center rounded-md bg-night-900 text-sm font-semibold text-white ">
            HB
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold text-brand-700">Holistique</span>
            <span className="block truncate text-base font-semibold leading-snug text-slate-900">Mon espace</span>
          </span>
        </Link>

        <div className={`mt-4 rounded-md border border-rule bg-white/92 p-3.5 sm:rounded-md sm:p-5 ${theme === "author" ? "hidden" : "hidden sm:block"}`}>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold text-brand-700">{areaLabel}</p>
            <span className={`rounded-sm px-2.5 py-1 text-[0.65rem] font-semibold ${meta.workspaceTone}`}>
              {meta.workspaceLabel}
            </span>
          </div>
          <p className="mt-2 text-xl font-semibold tracking-[-0.04em] text-slate-900 sm:mt-3 sm:text-[1.45rem]">{headline}</p>
          <p className="mt-2 hidden text-sm leading-7 text-slate-600 sm:block">{description}</p>
        </div>

        <div className={`mt-4 rounded-md border border-rule bg-paper p-4 ${theme === "author" ? "hidden xl:block" : "hidden sm:block"}`}>
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-night-900 text-sm font-semibold text-white">
              {initials || "HB"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{userName}</p>
              <p className="text-xs font-semibold text-slate-500">{userRole}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-sm bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Session active
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
                className={`flex min-h-11 shrink-0 items-center gap-2 rounded-md border px-3.5 py-2.5 text-sm font-medium transition xl:w-full xl:gap-3 xl:rounded-md xl:px-4 xl:py-3 ${
                  active
                    ? "border-night-900 bg-night-900 text-white "
                    : "border-rule bg-white/92 text-slate-700 hover:border-slate-400 hover:bg-white hover:text-slate-900"
                }`}
              >
                <DashboardIcon name={item.icon} className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={`mt-4 gap-3 rounded-md border border-rule bg-white/92 p-4 ${theme === "author" ? "hidden" : "hidden xl:grid"}`}>
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-night-50 text-night-800">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{meta.insightTitle}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{meta.insightCopy}</p>
            </div>
          </div>
          <div className="grid gap-2">
            {meta.bullets.map((bullet) => (
              <div key={bullet} className="rounded-md border border-rule bg-paper px-3 py-2 text-sm text-slate-700">
                {bullet}
              </div>
            ))}
          </div>
        </div>

        <div className={`mt-4 gap-3 rounded-md border border-rule bg-white/92 p-4 ${theme === "author" ? "hidden" : "hidden xl:grid"}`}>
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-night-50 text-night-600">
              <LayoutPanelTop className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Raccourcis</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Accédez rapidement à votre catalogue et au site public.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={meta.primaryShortcut.href}
              className="inline-flex items-center gap-2 rounded-sm border border-rule-strong bg-paper px-4 py-2 text-xs font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-white"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              {meta.primaryShortcut.label}
            </Link>
            <Link
              href={meta.secondaryShortcut.href}
              className="inline-flex items-center gap-2 rounded-sm border border-rule-strong bg-white px-4 py-2 text-xs font-semibold text-slate-900 transition hover:border-slate-400"
            >
              <Store className="h-3.5 w-3.5" />
              {meta.secondaryShortcut.label}
            </Link>
            <Link
              href="/books"
              className="inline-flex items-center gap-2 rounded-sm border border-rule-strong bg-white px-4 py-2 text-xs font-semibold text-slate-900 transition hover:border-slate-400"
            >
              <Compass className="h-3.5 w-3.5" />
              Catalogue
            </Link>
            <Link
              href="/home"
              className="inline-flex items-center gap-2 rounded-sm border border-rule-strong bg-white px-4 py-2 text-xs font-semibold text-slate-900 transition hover:border-slate-400"
            >
              <LayoutPanelTop className="h-3.5 w-3.5" />
              Site public
            </Link>
          </div>
          <LogoutButton className="inline-flex h-11 items-center justify-center gap-2 rounded-sm border border-night-900 bg-night-900 px-4 text-sm font-semibold text-white transition hover:bg-night-800 disabled:cursor-not-allowed disabled:opacity-70" />
        </div>
      </aside>

      <div className="min-w-0 space-y-4 sm:space-y-6">
        <section className={`rounded-md border border-rule-strong bg-white p-3 sm:rounded-md sm:p-4 ${theme === "author" ? "hidden" : "hidden lg:block"}`}>
          <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-sm px-3 py-1 text-[0.68rem] font-semibold ${meta.workspaceTone}`}>
                {meta.workspaceLabel}
              </span>
              <span className="rounded-sm border border-rule bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                {userRole}
              </span>
              <span className="hidden rounded-sm border border-emerald-50 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 sm:inline-flex">
                Compte actif
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <Link
                href={meta.primaryShortcut.href}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand-600 px-3 text-xs font-semibold text-white transition hover:bg-brand-700 sm:h-10 sm:min-h-0 sm:rounded-sm sm:px-4 sm:text-sm"
              >
                <ArrowUpRight className="h-4 w-4" />
                {meta.primaryShortcut.label}
              </Link>
              <Link
                href="/home"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-rule-strong bg-white px-3 text-xs font-semibold text-slate-900 transition hover:border-slate-400 sm:h-10 sm:min-h-0 sm:rounded-sm sm:px-4 sm:text-sm"
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
        className="fixed inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-50 flex gap-1 overflow-x-auto rounded-md border border-rule-strong bg-white/96 p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:hidden"
      >
        {navigation.map((item) => {
          const active = isActive(pathname, item);

          return (
            <Link
              key={`mobile-${item.href}`}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-14 min-w-[4.5rem] flex-1 flex-col items-center justify-center gap-1 rounded-md px-2 text-center text-[0.62rem] font-bold leading-tight transition ${
                active ? "bg-night-900 text-white" : "text-slate-600 hover:bg-paper-deep hover:text-slate-900"
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
