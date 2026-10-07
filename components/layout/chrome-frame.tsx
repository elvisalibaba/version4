"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Home, Library, Search, ShoppingCart, UserCircle2 } from "lucide-react";
import { CartFeedback } from "@/components/cart/cart-feedback";
import { CartCountBadge } from "@/components/cart/cart-indicator";

type ChromeFrameProps = {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
};

const appNavItems = [
  { label: "Accueil", href: "/home", icon: Home },
  { label: "Livres", href: "/books", icon: Search },
  { label: "Bibliothèque", href: "/library", icon: Library },
  { label: "Panier", href: "/cart", icon: ShoppingCart },
  { label: "Compte", href: "/dashboard", icon: UserCircle2 },
];

export function ChromeFrame({ header, footer, children }: ChromeFrameProps) {
  const pathname = usePathname();
  const isAuthRoute = ["/login", "/register", "/forgot-password", "/reset-password"].some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (pathname.startsWith("/admin")) {
    return <div className="min-h-screen">{children}</div>;
  }

  if (pathname.startsWith("/dashboard")) {
    return (
      <div className="min-h-screen bg-slate-50">
        <a
          href="#dashboard-content"
          className="fixed left-3 top-3 z-[200] -translate-y-24 rounded-md bg-night-900 px-4 py-3 text-sm font-bold text-white transition focus:translate-y-0"
        >
          Aller au contenu
        </a>
        <main id="dashboard-content" className="mx-auto min-h-screen w-full max-w-[100rem] px-2.5 pb-28 pt-2.5 sm:px-4 sm:pb-10 sm:pt-4 lg:px-6">
          {children}
        </main>
      </div>
    );
  }

  if (isAuthRoute) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-night-900 text-white">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
            <Link href="/home" className="flex min-w-0 items-center gap-2.5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="Accueil Holistique Books">
              <Image src="/logo.svg" alt="" width={44} height={44} className="h-11 w-11 brightness-0 invert" priority />
              <span className="truncate text-[1.05rem] font-bold tracking-tight">Holistique Books</span>
            </Link>
            <Link href="/books?access=free" className="inline-flex min-h-10 items-center rounded-md px-3 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white">
              Lire sans compte
            </Link>
          </div>
        </header>
        <main id="contenu" className="site-main min-h-[calc(100dvh-4rem)] pb-8">{children}</main>
      </div>
    );
  }

  return (
    <div className="hb-browser-shell">
      {header}
      <main id="contenu" className="site-main hb-mobile-main min-h-[60vh]">{children}</main>
      {footer}
      <CartFeedback />
      <div className="lg:hidden">
        <AppBottomNavigation pathname={pathname} />
      </div>
    </div>
  );
}

function AppBottomNavigation({ pathname }: { pathname: string }) {
  return (
    <nav className="hb-app-bottom-nav" aria-label="Navigation mobile principale">
      {appNavItems.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? "hb-app-nav-item is-active" : "hb-app-nav-item"}
            aria-current={active ? "page" : undefined}
          >
            <span className="relative">
              <Icon aria-hidden="true" className="h-5 w-5" />
              {item.href === "/cart" ? <CartCountBadge className="absolute -right-2.5 -top-1.5" /> : null}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function isActivePath(pathname: string, href: string) {
  if (href === "/home") {
    return pathname === "/" || pathname === "/home";
  }

  if (href === "/books") {
    return pathname.startsWith("/books") || pathname.startsWith("/book/") || pathname.startsWith("/librairie");
  }

  if (href === "/dashboard") {
    return pathname.startsWith("/dashboard");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
