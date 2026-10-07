"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Globe2, MapPin, Phone } from "lucide-react";
import { COMPANY } from "@/lib/holistique";

type FooterLink = {
  label: string;
  href: string;
};

const footerGroups: Array<{ title: string; links: FooterLink[] }> = [
  {
    title: "Découvrir",
    links: [
      { label: "Tous les livres", href: "/books" },
      { label: "Lire gratuitement", href: "/books?access=free" },
      { label: "Élèves & étudiants", href: "/education" },
      { label: "Auteurs", href: "/authors" },
      { label: "Magazine", href: "/blog" },
    ],
  },
  {
    title: "Votre lecture",
    links: [
      { label: "Mon espace lecteur", href: "/dashboard/reader" },
      { label: "Ma bibliothèque", href: "/dashboard/reader/library" },
      { label: "Abonnements", href: "/dashboard/reader/subscriptions" },
      { label: "Panier", href: "/cart" },
      { label: "Créer un compte", href: "/register?role=reader" },
    ],
  },
  {
    title: "Publier avec nous",
    links: [
      { label: "Publier votre livre", href: "/register?role=author" },
      { label: "Espace auteur", href: "/dashboard/author" },
      { label: "Services éditoriaux", href: "/services" },
      { label: "Formation éditoriale", href: "/formation-editoriale" },
      { label: "Ressources pour auteurs", href: "/ressources" },
    ],
  },
  {
    title: "Holistique Books",
    links: [
      { label: "Qui sommes-nous ?", href: "/qui-sommes-nous" },
      { label: "Nos trois pôles", href: "/qui-sommes-nous#poles" },
      { label: "Packs d’édition", href: "/services#packs" },
      { label: "Questions fréquentes", href: "/faq" },
      { label: "Soutenir le projet", href: "/don" },
    ],
  },
];

const legalLinks: FooterLink[] = [
  { label: "Conditions d’utilisation", href: "/conditions" },
  { label: "Confidentialité", href: "/confidentialite" },
  { label: "Cookies", href: "/cookies" },
];

const linkClass = "text-sm text-night-100 transition hover:text-white hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-sm";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 bg-night-900 text-white">
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="block w-full bg-night-700 py-3.5 text-center text-sm font-medium text-white transition hover:bg-night-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
      >
        Retour en haut
      </button>

      <div className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8 lg:pb-10 lg:pt-12">
        {/* Bureau : colonnes */}
        <div className="hidden gap-8 lg:grid lg:grid-cols-5">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h2 className="text-base font-bold text-white">{group.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className={linkClass}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <address className="not-italic">
            <h2 className="text-base font-bold text-white">Nous contacter</h2>
            <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-night-100"><MapPin aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-brand-300" /><span>{COMPANY.address.map((line) => <span key={line} className="block">{line}</span>)}</span></p>
            <a href={COMPANY.phoneHref} className={`${linkClass} mt-3 inline-flex items-center gap-2`}><Phone aria-hidden="true" className="h-4 w-4 text-brand-300" />{COMPANY.phone}</a>
            <a href={`mailto:${COMPANY.email}`} className={`${linkClass} mt-2 block`}>{COMPANY.email}</a>
          </address>
        </div>

        {/* Mobile : accordéons */}
        <div className="divide-y divide-white/10 border-y border-white/10 lg:hidden">
          {footerGroups.map((group) => (
            <details key={group.title} className="group">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between text-[0.95rem] font-semibold [&::-webkit-details-marker]:hidden">
                {group.title}
                <ChevronDown aria-hidden="true" className="h-4 w-4 text-night-200 transition-transform group-open:rotate-180" />
              </summary>
              <ul className="space-y-1 pb-4">
                {group.links.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className={`${linkClass} flex min-h-10 items-center`}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </details>
          ))}
          <div className="py-5 text-sm text-night-100">
            <p className="flex items-start gap-2"><MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />{COMPANY.address.join(", ")}</p>
            <a href={COMPANY.phoneHref} className="mt-3 inline-flex min-h-10 items-center gap-2 font-semibold text-white"><Phone aria-hidden="true" className="h-4 w-4 text-brand-300" />{COMPANY.phone}</a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 bg-night-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 pb-24 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:pb-6">
          <Link href="/home" className="flex items-center gap-2.5 self-start rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="Accueil Holistique Books">
            <Image src="/logo.svg" alt="" width={32} height={32} className="h-8 w-8 brightness-0 invert" />
            <span className="leading-tight">
              <span className="block text-base font-bold">Holistique Books</span>
              <span className="block text-xs italic text-night-200">{COMPANY.slogan}</span>
            </span>
          </Link>

          <div className="flex flex-col gap-3 text-xs text-night-200 lg:items-end">
            <nav aria-label="Informations légales" className="flex flex-wrap gap-x-5 gap-y-2">
              {legalLinks.map((link) => (
                <Link key={link.href} href={link.href} className="transition hover:text-white hover:underline">
                  {link.label}
                </Link>
              ))}
            </nav>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="inline-flex items-center gap-1.5"><Globe2 aria-hidden="true" className="h-3.5 w-3.5" /> Français · République démocratique du Congo</span>
              <span>© {year} Holistique Books. Tous droits réservés.</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
