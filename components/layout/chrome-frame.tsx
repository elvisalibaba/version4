"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, Library, Search, ShoppingCart, UserCircle2 } from "lucide-react";

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
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,153,0,0.10),transparent_24%),radial-gradient(circle_at_top_right,rgba(20,110,180,0.08),transparent_24%),linear-gradient(180deg,#fbfaf7_0%,#f4efe6_100%)]">
        <a
          href="#dashboard-content"
          className="fixed left-3 top-3 z-[200] -translate-y-24 rounded-xl bg-[#171717] px-4 py-3 text-sm font-bold text-white transition focus:translate-y-0"
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
      <div className="min-h-screen bg-[#f5f0e7]">
        <header className="sticky top-0 z-50 border-b border-[#d9cebd] bg-[#fffaf2]/95 backdrop-blur-xl">
          <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-3 px-3 sm:min-h-16 sm:px-6">
            <Link href="/home" className="flex min-w-0 items-center gap-2.5" aria-label="Accueil Holistique Books">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#173d2c] text-[#f2c66f]">
                <BookOpen aria-hidden="true" className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-serif text-base font-bold tracking-[-0.02em] text-[#17231d] sm:text-lg">Holistique Books</span>
                <span className="block text-[0.55rem] font-bold uppercase tracking-[0.18em] text-[#a94b34]">Maison éditoriale africaine</span>
              </span>
            </Link>
            <Link href="/library" className="inline-flex min-h-11 items-center rounded-full px-3 text-xs font-bold text-[#173d2c] transition hover:bg-[#efe6d8] sm:px-4 sm:text-sm">
              Lire sans compte
            </Link>
          </div>
        </header>
        <main className="site-main min-h-[calc(100dvh-4rem)] pb-8">{children}</main>
      </div>
    );
  }

  return (
    <div className="hb-browser-shell">
      {header}
      <main className="site-main hb-mobile-main min-h-[60vh]">{children}</main>
      {footer}
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
            <Icon aria-hidden="true" className="h-5 w-5" />
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
