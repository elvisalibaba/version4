"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, Library, Search, ShoppingCart, UserCircle2, WifiOff } from "lucide-react";

type ChromeFrameProps = {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
};

export function ChromeFrame({ header, footer, children }: ChromeFrameProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");
  const isStandalone = useStandaloneDisplayMode();
  const isOnline = useNetworkStatus();

  if (isAdminRoute) {
    return <main className="min-h-screen">{children}</main>;
  }

  if (isStandalone) {
    return (
      <div className="hb-app-shell">
        <header className="hb-app-topbar">
          <Link href="/home" className="hb-app-brand" aria-label="Holistique Books">
            <span className="hb-app-logo">
              <Image src="/logo.svg" alt="" width={28} height={28} className="h-7 w-7 object-contain" priority />
            </span>
            <span className="hb-app-brand-copy">
              <span className="hb-app-brand-name">Holistique</span>
              <span className="hb-app-brand-state">{isOnline ? currentSectionLabel(pathname) : "Hors ligne"}</span>
            </span>
          </Link>

          <div className="hb-app-top-actions">
            {!isOnline ? (
              <span className="hb-app-offline-pill" aria-label="Mode hors ligne">
                <WifiOff className="h-4 w-4" />
              </span>
            ) : null}
            <Link href="/books" className="hb-app-icon-button" aria-label="Rechercher">
              <Search className="h-5 w-5" />
            </Link>
            <Link href="/dashboard" className="hb-app-icon-button" aria-label="Compte">
              <UserCircle2 className="h-5 w-5" />
            </Link>
          </div>
        </header>

        <main className="hb-app-main">{children}</main>

        <nav className="hb-app-bottom-nav" aria-label="Navigation principale">
          {appNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(pathname, item.href);

            return (
              <Link key={item.href} href={item.href} className={isActive ? "hb-app-nav-item is-active" : "hb-app-nav-item"} aria-current={isActive ? "page" : undefined}>
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    );
  }

  return (
    <>
      {header}
      <main className="site-main min-h-[60vh]">{children}</main>
      {footer}
    </>
  );
}

const appNavItems = [
  { label: "Accueil", href: "/home", icon: Home },
  { label: "Librairie", href: "/librairie", icon: Library },
  { label: "Lire", href: "/dashboard/reader/library", icon: BookOpen },
  { label: "Panier", href: "/cart", icon: ShoppingCart },
];

function useStandaloneDisplayMode() {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const updateDisplayMode = () => {
      const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
      setIsStandalone(
        window.matchMedia("(display-mode: standalone)").matches ||
          window.matchMedia("(display-mode: fullscreen)").matches ||
          navigatorWithStandalone.standalone === true ||
          document.referrer.startsWith("android-app://"),
      );
    };

    updateDisplayMode();

    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const fullscreenQuery = window.matchMedia("(display-mode: fullscreen)");
    standaloneQuery.addEventListener("change", updateDisplayMode);
    fullscreenQuery.addEventListener("change", updateDisplayMode);

    return () => {
      standaloneQuery.removeEventListener("change", updateDisplayMode);
      fullscreenQuery.removeEventListener("change", updateDisplayMode);
    };
  }, []);

  return isStandalone;
}

function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    function updateStatus() {
      setIsOnline(window.navigator.onLine);
    }

    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  return isOnline;
}

function isActivePath(pathname: string, href: string) {
  if (href === "/home") {
    return pathname === "/" || pathname === "/home";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function currentSectionLabel(pathname: string) {
  if (pathname.startsWith("/librairie") || pathname.startsWith("/books")) {
    return "Librairie";
  }

  if (pathname.startsWith("/dashboard")) {
    return "Espace";
  }

  if (pathname.startsWith("/cart")) {
    return "Panier";
  }

  if (pathname.startsWith("/blog")) {
    return "Blog";
  }

  return "Accueil";
}
