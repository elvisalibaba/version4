"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = { label: string; href: string };

// Sans useSearchParams (qui forcerait le rendu dynamique) : « Lire gratuitement » reste un raccourci.
function isActive(pathname: string, href: string) {
  if (href.includes("?")) return false;
  if (href === "/books") return pathname === "/books" || pathname.startsWith("/book/") || pathname.startsWith("/librairie");
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Navigation principale : l'onglet courant est souligné du rouge de la maison. */
export function MainNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigation principale" className="mx-auto flex h-11 max-w-7xl items-center gap-1 overflow-x-auto px-2 [scrollbar-width:none] sm:px-4 lg:gap-3 lg:px-6 [&::-webkit-scrollbar]:hidden">
      {links.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className="hb-tab shrink-0 whitespace-nowrap px-2.5 py-2 text-[0.9rem] font-medium text-night-800"
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
