"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUp,
  BookOpen,
  ChevronDown,
  Globe2,
} from "lucide-react";

type FooterLink = {
  label: string;
  href: string;
};

const footerGroups: Array<{ title: string; links: FooterLink[] }> = [
  {
    title: "Découvrir",
    links: [
      { label: "Tous les livres", href: "/books" },
      { label: "Bibliothèque ouverte", href: "/library" },
      { label: "Tous les auteurs", href: "/authors" },
      { label: "Le blog", href: "/blog" },
    ],
  },
  {
    title: "Votre lecture",
    links: [
      { label: "Ma bibliothèque", href: "/dashboard/reader/library" },
      { label: "Holistique Plus", href: "/dashboard/reader/subscriptions" },
      { label: "Créer un compte lecteur", href: "/register?role=reader" },
      { label: "Se connecter", href: "/login" },
    ],
  },
  {
    title: "Écrire & publier",
    links: [
      { label: "Créer un espace auteur", href: "/register?role=author" },
      { label: "Services éditoriaux", href: "/services" },
      { label: "Conseils et ressources", href: "/ressources" },
      { label: "Qui sommes-nous ?", href: "/qui-sommes-nous" },
    ],
  },
];

const legalLinks: FooterLink[] = [
  { label: "Conditions", href: "/conditions" },
  { label: "Confidentialité", href: "/confidentialite" },
  { label: "Cookies", href: "/cookies" },
  { label: "Accessibilité", href: "/accessibilite" },
];

function DesktopFooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-white/42">{title}</h3>
      <ul className="mt-4 space-y-3">
        {links.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="rounded-sm text-sm leading-6 text-white/68 transition hover:text-[#f2c66f] focus:outline-none focus:ring-2 focus:ring-[#e8ac42]"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MobileFooterAccordion({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <details className="group border-b border-white/10">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-3 text-sm font-bold text-white [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown
          aria-hidden="true"
          className="h-4 w-4 text-white/45 transition-transform duration-200 group-open:rotate-180"
        />
      </summary>
      <ul className="space-y-1 pb-3">
        {links.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex min-h-11 items-center rounded-xl px-3 text-sm text-white/68 transition hover:bg-white/[0.06] hover:text-[#f2c66f] focus:outline-none focus:ring-2 focus:ring-[#e8ac42]"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#102d21] text-white">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border-[65px] border-[#e8ac42]/80" />
      <div className="pointer-events-none absolute bottom-0 left-[28%] h-24 w-44 -skew-x-12 bg-[#c95d3e]/80" />

      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Retour en haut de la page"
        className="group relative z-10 flex min-h-11 w-full items-center justify-center gap-2 border-b border-white/10 bg-white/[0.035] px-4 text-xs font-semibold text-white/65 transition hover:bg-white/[0.07] hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#e8ac42]"
      >
        <ArrowUp aria-hidden="true" className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
        Retour en haut
      </button>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-28 pt-7 sm:px-6 lg:px-8 lg:pb-8 lg:pt-12">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_repeat(3,minmax(0,1fr))]">
          <div>
            <Link href="/home" className="inline-flex items-center gap-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff7a5c]">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[#e8ac42] text-[#173d2c] shadow-[0_12px_30px_rgba(232,172,66,0.2)]">
                <BookOpen aria-hidden="true" className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-serif text-lg tracking-[-0.01em] text-white">Holistique Books</span>
                <span className="mt-0.5 block text-[.6rem] font-bold uppercase tracking-[.16em] text-[#f2c66f]">Maison éditoriale africaine</span>
              </span>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-6 text-white/62">
              Une maison éditoriale mobile pour découvrir des voix, lire sans distraction et publier avec exigence.
            </p>

            <div className="mt-5 grid gap-2 sm:flex sm:flex-wrap">
              <Link
                href="/library"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#e8ac42] px-5 py-3 text-sm font-bold text-[#173d2c] transition hover:bg-[#f2c66f] focus:outline-none focus:ring-2 focus:ring-[#f2c66f]"
              >
                Lire gratuitement
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <Link
                href="/register?role=author"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:border-white/40 hover:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-[#e8ac42]"
              >
                Publier un livre
              </Link>
            </div>
          </div>

          <div className="mt-1 lg:hidden">
            {footerGroups.map((group) => (
              <MobileFooterAccordion key={group.title} title={group.title} links={group.links} />
            ))}
          </div>

          {footerGroups.map((group) => (
            <div key={group.title} className="hidden lg:block">
              <DesktopFooterColumn title={group.title} links={group.links} />
            </div>
          ))}
        </div>

        <div className="mt-6 border-t border-white/10 pt-5 lg:mt-10 lg:pt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="inline-flex items-center gap-2 text-xs text-white/42">
              <Globe2 aria-hidden="true" className="h-3.5 w-3.5" />
              Français · République démocratique du Congo
            </p>

            <nav aria-label="Liens juridiques" className="flex flex-wrap gap-x-4 gap-y-2">
              {legalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-sm text-xs text-white/42 transition hover:text-[#f2c66f] focus:outline-none focus:ring-2 focus:ring-[#e8ac42]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <p className="mt-4 text-xs text-white/32">© {year} Holistique Books. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
