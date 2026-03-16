"use client";

import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Blocks,
  BookCopy,
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
  Users,
} from "lucide-react";

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(123,97,255,0.14),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(255,161,138,0.14),_transparent_24%),linear-gradient(180deg,_#faf7ff_0%,_#f4efff_52%,_#f8f5ff_100%)]">
      <div className="mx-auto grid min-h-screen max-w-[1700px] gap-6 px-4 py-4 lg:grid-cols-[320px_minmax(0,1fr)] xl:px-6">
        <aside className="sticky top-4 self-start rounded-[2rem] border border-violet-200/70 bg-white/85 p-5 shadow-[0_24px_60px_rgba(89,68,219,0.14)] backdrop-blur xl:p-6">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[linear-gradient(135deg,#7d65ff,#5a49df)] text-lg font-extrabold text-white shadow-[0_18px_34px_rgba(90,73,223,0.28)]">
              HB
            </span>
            <span>
              <span className="block text-[11px] font-semibold uppercase tracking-[0.28em] text-violet-500">Admin control</span>
              <span className="block text-xl font-semibold tracking-[-0.03em] text-slate-950">HolistiqueBooks</span>
            </span>
          </Link>

          <div className="mt-6 rounded-[1.7rem] border border-violet-200/60 bg-[radial-gradient(circle_at_top_right,_rgba(123,97,255,0.14),_transparent_28%),linear-gradient(180deg,_rgba(246,243,255,0.96),_rgba(255,255,255,0.96))] p-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin
            </span>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-slate-950">Poste de controle</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Supervision business, editoriale et operationnelle de la plateforme depuis un point d entree unique.
            </p>

            <div className="mt-5 rounded-[1.4rem] border border-violet-200/60 bg-white/90 p-4">
              <p className="text-sm font-semibold text-slate-950">{profileName}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{profileEmail}</p>
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
                            ? "bg-[linear-gradient(135deg,rgba(109,89,240,0.16),rgba(109,89,240,0.08))] text-violet-950 shadow-[inset_0_0_0_1px_rgba(109,89,240,0.12)]"
                            : "text-slate-600 hover:bg-violet-50 hover:text-slate-950"
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

          <div className="mt-6 rounded-[1.5rem] border border-violet-200/60 bg-white/90 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-500">Passerelles</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/home" className="cta-secondary px-4 py-2 text-xs">
                Site public
              </Link>
              <Link href="/dashboard" className="cta-secondary px-4 py-2 text-xs">
                Espaces users
              </Link>
            </div>
          </div>
        </aside>

        <div className="min-w-0 py-1">{children}</div>
      </div>
    </div>
  );
}
