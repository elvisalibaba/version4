"use client";

import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Blocks,
  BookCopy,
  BringToFront,
  CreditCard,
  ChevronDown,
  FileText,
  GraduationCap,
  Highlighter,
  LayoutDashboard,
  LibraryBig,
  Menu,
  Package,
  PenTool,
  Receipt,
  ShieldCheck,
  Smartphone,
  Star,
  Tag,
  TrendingUp,
  Users,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";

type NavigationItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  exact?: boolean;
};

const navigationGroups: Array<{ title: string; items: NavigationItem[] }> = [
  {
    title: "Pilotage",
    items: [{ href: "/admin", label: "Vue d'ensemble", icon: LayoutDashboard, exact: true }],
  },
  {
    title: "Catalogue",
    items: [
      { href: "/admin/books", label: "Livres", icon: BookCopy },
      { href: "/admin/formats", label: "Formats", icon: Package },
      { href: "/admin/authors", label: "Auteurs", icon: PenTool },
    ],
  },
  {
    title: "Commerce",
    items: [
      { href: "/admin/orders", label: "Commandes", icon: Receipt },
      { href: "/admin/library", label: "Bibliothèque", icon: LibraryBig },
      { href: "/admin/subscriptions/plans", label: "Plans Premium", icon: Blocks },
      { href: "/admin/subscriptions/users", label: "Abonnés", icon: CreditCard },
    ],
  },
  {
    title: "Communauté",
    items: [
      { href: "/admin/users", label: "Utilisateurs", icon: Users },
      { href: "/admin/editorial-training", label: "Formation éditoriale", icon: GraduationCap },
      { href: "/admin/ratings", label: "Notes", icon: Star },
      { href: "/admin/highlights", label: "Surlignages", icon: Highlighter },
    ],
  },
  {
    title: "Marketing",
    items: [
      { href: "/admin/blog", label: "Blog", icon: FileText },
      { href: "/admin/flash-sales", label: "Ventes flash", icon: Tag },
      { href: "/admin/home-positioning", label: "Mise en avant", icon: BringToFront },
      { href: "/admin/mobile-app", label: "Application", icon: Smartphone },
    ],
  },
];

function isActive(pathname: string, item: NavigationItem) {
  if (item.exact) {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function AdminNavigation({ pathname, compact = false }: { pathname: string; compact?: boolean }) {
  return (
    <div className={compact ? "space-y-2.5" : "space-y-4 sm:space-y-5"}>
      {navigationGroups.map((group, groupIndex) => {
        const groupLabelId = `${compact ? "mobile" : "desktop"}-admin-navigation-${groupIndex}`;

        return (
          <div key={group.title} className="space-y-2">
            <p
              id={groupLabelId}
              className="px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500"
            >
              {group.title}
            </p>
            <nav
              aria-labelledby={groupLabelId}
              className={compact ? "grid grid-cols-2 gap-1.5" : "grid gap-1.5"}
            >
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 min-w-0 items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold leading-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146eb4] focus-visible:ring-offset-2 sm:rounded-2xl sm:px-3 sm:py-2.5 sm:text-sm ${
                      active
                        ? "border border-[#171717] bg-[#171717] text-white shadow-[0_18px_36px_rgba(15,23,42,0.14)]"
                        : "border border-[#ece4d7] bg-white text-slate-600 hover:border-[#ecdcc8] hover:bg-[#fcfaf6] hover:text-slate-950"
                    }`}
                  >
                    <Icon aria-hidden={true} className="h-4 w-4 shrink-0" />
                    <span className={compact ? "line-clamp-2" : "truncate"}>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        );
      })}
    </div>
  );
}

type AdminShellProps = {
  profileName: string;
  profileEmail: string;
  children: ReactNode;
};

export function AdminShell({ profileName, profileEmail, children }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,153,0,0.14),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(20,110,180,0.12),_transparent_24%),linear-gradient(180deg,_#fbfaf7_0%,_#f5f0e6_52%,_#f7f4ee_100%)]">
      <a
        href="#admin-main"
        className="sr-only z-[100] rounded-full bg-[#171717] px-4 py-3 text-sm font-semibold text-white shadow-xl focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Aller au contenu principal
      </a>

      <div className="mx-auto grid min-h-screen max-w-[1720px] gap-3 px-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] pt-[max(0.625rem,env(safe-area-inset-top))] sm:gap-6 sm:px-4 sm:pb-[max(1rem,env(safe-area-inset-bottom))] sm:pt-[max(1rem,env(safe-area-inset-top))] lg:grid-cols-[265px_minmax(0,1fr)] xl:px-6">
        <aside
          aria-label="Navigation et session administrateur"
          className="sticky top-[max(0.5rem,env(safe-area-inset-top))] z-40 min-w-0 self-start rounded-[1.35rem] border border-[#e6dccd] bg-white/95 p-3 shadow-[0_18px_44px_rgba(15,23,42,0.08)] backdrop-blur sm:rounded-[2.1rem] sm:p-5 sm:shadow-[0_28px_68px_rgba(15,23,42,0.08)] lg:top-4 xl:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/admin"
              aria-label="HolistiqueBooks — accueil de l'administration"
              className="flex min-w-0 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146eb4] focus-visible:ring-offset-2 sm:gap-3"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#173d2c] text-sm font-extrabold text-[#f2c66f] sm:h-12 sm:w-12 sm:text-lg">
                HB
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a5a0e] sm:text-[11px] sm:tracking-[0.28em]">
                  Administration
                </span>
                <span className="block truncate text-base font-semibold tracking-[-0.03em] text-slate-950 sm:text-xl">
                  HolistiqueBooks
                </span>
              </span>
            </Link>

            <div className="shrink-0 lg:hidden">
              <LogoutButton
                compact
                label="Se déconnecter de l'administration"
                className="group inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#e4d7c6] bg-[#171717] text-white shadow-sm transition hover:bg-[#0f172a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146eb4] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
          </div>

          <div className="mt-2 flex min-w-0 items-center gap-2 rounded-xl border border-[#ece4d7] bg-[#fbf8f2] px-3 py-2 lg:hidden">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#e9f7ee] text-[#237a43]">
              <ShieldCheck aria-hidden={true} className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold text-slate-950">{profileName}</span>
              <span className="block truncate text-[11px] text-slate-500">{profileEmail}</span>
            </span>
          </div>

          <div className="hidden">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#fff1db] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b96e12]">
              <ShieldCheck aria-hidden={true} className="h-3.5 w-3.5" />
              Admin
            </span>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-slate-950">Poste de controle</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Gérez les livres, les commandes et les utilisateurs depuis un espace sécurisé.
            </p>

            <div className="mt-5 rounded-[1.4rem] border border-[#ece4d7] bg-white/95 p-4">
              <p className="text-sm font-semibold text-slate-950">{profileName}</p>
              <p className="mt-1 break-all text-xs uppercase tracking-[0.12em] text-slate-500">{profileEmail}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#e9f7ee] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#237a43]">
                  <ShieldCheck aria-hidden={true} className="h-3.5 w-3.5" />
                  Session active
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#e9f3fb] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#146eb4]">
                  <TrendingUp aria-hidden={true} className="h-3.5 w-3.5" />
                  Administration
                </span>
              </div>
            </div>
          </div>

          <details className="group mt-2 rounded-xl border border-[#ece4d7] bg-[#fbf8f2] lg:hidden">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-3.5 text-sm font-bold text-[#403a34] [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2">
                <Menu aria-hidden={true} className="h-4 w-4 text-[#9a5a0e]" />
                Navigation admin
              </span>
              <ChevronDown aria-hidden={true} className="h-4 w-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="max-h-[58dvh] overscroll-contain overflow-y-auto border-t border-[#ece4d7] p-2.5">
              <AdminNavigation pathname={pathname} compact />
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#ece4d7] pt-3">
                <Link
                  href="/home"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#e4d7c6] bg-white px-3 text-xs font-semibold text-[#26221d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146eb4] focus-visible:ring-offset-2"
                >
                  Site public
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#e4d7c6] bg-white px-3 text-xs font-semibold text-[#26221d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146eb4] focus-visible:ring-offset-2"
                >
                  Espace utilisateur
                </Link>
              </div>
            </div>
          </details>

          <div className="mt-6 hidden lg:block">
            <AdminNavigation pathname={pathname} />
          </div>

          <div className="hidden">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b96e12]">Passerelles</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/home"
                className="inline-flex items-center justify-center rounded-full border border-[#e4d7c6] bg-[#fff7ea] px-4 py-2 text-xs font-semibold text-[#26221d] transition hover:border-[#ccbba7] hover:bg-white"
              >
                Site public
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full border border-[#e4d7c6] bg-white px-4 py-2 text-xs font-semibold text-[#26221d] transition hover:border-[#ccbba7]"
              >
                Espaces users
              </Link>
            </div>
            <div className="mt-4">
              <LogoutButton className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[#171717] bg-[#171717] px-4 text-sm font-semibold text-white transition hover:bg-[#0f172a] disabled:cursor-not-allowed disabled:opacity-70" />
            </div>
          </div>
        </aside>

        <main id="admin-main" tabIndex={-1} className="min-w-0 py-1 outline-none">
          <div className="hidden">
            <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="hidden flex-wrap items-center gap-2 sm:flex">
                <span className="rounded-full bg-[#fff1db] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#b96e12]">
                  Administration
                </span>
                <span className="rounded-full border border-[#e5ddd1] bg-white px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Accès sécurisé
                </span>
                <span className="hidden rounded-full border border-[#d9eadf] bg-[#eefaf2] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#237a43] sm:inline-flex">
                  Session active
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                <Link
                  href="/admin/books"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#ff9900] px-3 text-xs font-semibold text-[#171717] transition hover:bg-[#f08f00] sm:h-10 sm:min-h-0 sm:rounded-full sm:px-4 sm:text-sm"
                >
                  Gérer les livres
                </Link>
                <Link
                  href="/admin/orders"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#e5ddd1] bg-white px-3 text-xs font-semibold text-[#26221d] transition hover:border-[#ccbba7] sm:h-10 sm:min-h-0 sm:rounded-full sm:px-4 sm:text-sm"
                >
                  Commandes
                </Link>
              </div>
            </div>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
