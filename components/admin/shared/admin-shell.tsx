"use client";

import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Blocks,
  BookCopy,
  BringToFront,
  CreditCard,
  FileText,
  Highlighter,
  LayoutDashboard,
  LibraryBig,
  Package,
  PenTool,
  Receipt,
  ShieldCheck,
  Star,
  Tag,
  TrendingUp,
  Users,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";

type NavigationItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
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
      { href: "/admin/library", label: "Bibliotheque", icon: LibraryBig },
      { href: "/admin/subscriptions/plans", label: "Plans Premium", icon: Blocks },
      { href: "/admin/subscriptions/users", label: "Abonnes", icon: CreditCard },
    ],
  },
  {
    title: "Communaute",
    items: [
      { href: "/admin/users", label: "Utilisateurs", icon: Users },
      { href: "/admin/ratings", label: "Notes", icon: Star },
      { href: "/admin/highlights", label: "Highlights", icon: Highlighter },
    ],
  },
  {
    title: "Marketing",
    items: [
      { href: "/admin/blog", label: "Blog", icon: FileText },
      { href: "/admin/flash-sales", label: "Flash sale", icon: Tag },
      { href: "/admin/home-positioning", label: "Mise en avant", icon: BringToFront },
    ],
  },
];

function isActive(pathname: string, item: NavigationItem) {
  if (item.exact) {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
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
      <div className="mx-auto grid min-h-screen max-w-[1720px] gap-6 px-4 py-4 lg:grid-cols-[325px_minmax(0,1fr)] xl:px-6">
        <aside className="sticky top-4 self-start rounded-[2.1rem] border border-[#e6dccd] bg-white/90 p-5 shadow-[0_28px_68px_rgba(15,23,42,0.08)] backdrop-blur xl:p-6">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[linear-gradient(135deg,#111827,#146eb4)] text-lg font-extrabold text-white shadow-[0_18px_34px_rgba(17,24,39,0.22)]">
              HB
            </span>
            <span>
              <span className="block text-[11px] font-semibold uppercase tracking-[0.28em] text-[#b96e12]">Admin control</span>
              <span className="block text-xl font-semibold tracking-[-0.03em] text-slate-950">HolistiqueBooks</span>
            </span>
          </Link>

          <div className="mt-6 rounded-[1.7rem] border border-[#ece4d7] bg-[radial-gradient(circle_at_top_right,_rgba(255,153,0,0.12),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,244,237,0.98))] p-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#fff1db] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b96e12]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin
            </span>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-slate-950">Poste de controle</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Supervision business, editoriale et operationnelle dans une experience plus proche d une marketplace publishing.
            </p>

            <div className="mt-5 rounded-[1.4rem] border border-[#ece4d7] bg-white/95 p-4">
              <p className="text-sm font-semibold text-slate-950">{profileName}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{profileEmail}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#e9f7ee] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#237a43]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Session active
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#e9f3fb] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#146eb4]">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Pilotage live
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            {navigationGroups.map((group) => (
              <div key={group.title} className="space-y-2">
                <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{group.title}</p>
                <nav className="grid gap-1.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(pathname, item);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                          active
                            ? "border border-[#171717] bg-[#171717] text-white shadow-[0_18px_36px_rgba(15,23,42,0.14)]"
                            : "border border-transparent text-slate-600 hover:border-[#ecdcc8] hover:bg-[#fcfaf6] hover:text-slate-950"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-[#ece4d7] bg-white/95 p-4">
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

        <div className="min-w-0 py-1">
          <div className="mb-6 rounded-[2rem] border border-[#e6dccd] bg-[radial-gradient(circle_at_top_left,_rgba(255,153,0,0.10),_transparent_22%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,244,237,0.95))] p-4 shadow-[0_22px_54px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#fff1db] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#b96e12]">
                  Admin marketplace
                </span>
                <span className="rounded-full border border-[#e5ddd1] bg-white px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Workflow propre
                </span>
                <span className="rounded-full border border-[#d9eadf] bg-[#eefaf2] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#237a43]">
                  Supabase connecte
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/admin/books"
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-[#ff9900] px-4 text-sm font-semibold text-[#171717] transition hover:bg-[#f08f00]"
                >
                  Catalogue admin
                </Link>
                <Link
                  href="/admin/orders"
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-[#e5ddd1] bg-white px-4 text-sm font-semibold text-[#26221d] transition hover:border-[#ccbba7]"
                >
                  Commandes
                </Link>
              </div>
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
