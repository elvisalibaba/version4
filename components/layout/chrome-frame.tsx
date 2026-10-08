"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Library, Search, ShoppingCart, UserCircle2 } from "lucide-react";
import { LogoLink } from "@/components/brand/logo";
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
      <div className="min-h-screen bg-paper">
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
      <div className="min-h-screen bg-paper">
        <header className="border-b border-rule bg-paper">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
            <LogoLink height={32} />
            <Link href="/librairie?is_free=1" className="hb-link text-sm font-medium text-night-800">
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
