"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Menu, X } from "lucide-react";
import { cx } from "@/components/ui/cx";

export type NavLink = { label: string; href: string };

// Sans useSearchParams (qui forcerait le rendu dynamique) ; les ancres ne sont jamais « actives ».
function isActive(pathname: string, href: string) {
  if (href.includes("#") || href.includes("?")) return false;
  if (href === "/librairie") return pathname === "/librairie" || pathname === "/books" || pathname.startsWith("/book/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Navigation principale (bureau) : le lien courant est souligné de bleu. */
export function MainNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigation principale" className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {links.map((link) => {
          const active = isActive(pathname, link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "hb-tab inline-flex min-h-11 items-center px-2.5 text-[0.9rem] font-semibold transition-colors xl:px-3",
                  active ? "text-brand-deep" : "text-ink hover:text-brand-deep",
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Menu mobile : se referme à chaque navigation et avec Échap. */
export function MobileMenu({ links, children }: { links: NavLink[]; children?: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);
  const panelId = useId();

  // Referme le menu quand la page change (ajustement d'état pendant le rendu).
  if (open && openedAt !== pathname) {
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          setOpenedAt(pathname);
          setOpen((value) => !value);
        }}
        className="grid h-11 w-11 place-items-center rounded-full text-ink transition-colors hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-deep"
      >
        {open ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
        <span className="sr-only">{open ? "Fermer le menu" : "Ouvrir le menu"}</span>
      </button>
      <div id={panelId} hidden={!open} className="absolute inset-x-0 top-full border-b border-line bg-white shadow-[var(--shadow-card)]">
        <nav aria-label="Navigation principale" className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <ul className="divide-y divide-line">
            {links.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cx("flex min-h-12 items-center font-display text-[0.95rem] font-bold", active ? "text-brand-deep" : "text-ink")}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          {children ? <div className="flex flex-col gap-2 border-t border-line py-4">{children}</div> : null}
        </nav>
      </div>
    </div>
  );
}
