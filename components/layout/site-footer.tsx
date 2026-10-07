"use client";

import Link from "next/link";
import { ArrowUp, ChevronDown, MapPin, MessageCircle, Phone } from "lucide-react";
import { Ribbon, Wordmark } from "@/components/brand/ribbon";
import { COMPANY, INTERVENTION_POLES } from "@/lib/holistique";

type FooterLink = { label: string; href: string };

const footerGroups: Array<{ title: string; links: FooterLink[] }> = [
  {
    title: "Lire",
    links: [
      { label: "Catalogue", href: "/books" },
      { label: "Lire gratuitement", href: "/books?access=free" },
      { label: "Élèves & étudiants", href: "/education" },
      { label: "Auteurs", href: "/authors" },
      { label: "Magazine", href: "/blog" },
    ],
  },
  {
    title: "Votre compte",
    links: [
      { label: "Mon espace lecteur", href: "/dashboard/reader" },
      { label: "Ma bibliothèque", href: "/dashboard/reader/library" },
      { label: "Abonnements", href: "/dashboard/reader/subscriptions" },
      { label: "Panier", href: "/cart" },
      { label: "Créer un compte", href: "/register?role=reader" },
    ],
  },
  {
    title: "Publier",
    links: [
      { label: "Publier un livre", href: "/register?role=author" },
      { label: "Espace auteur", href: "/dashboard/author" },
      { label: "Services éditoriaux", href: "/services" },
      { label: "Packs d’édition", href: "/services#packs" },
      { label: "Formation éditoriale", href: "/formation-editoriale" },
      { label: "Ressources pour auteurs", href: "/ressources" },
    ],
  },
  {
    title: "La maison",
    links: [
      { label: "Qui sommes-nous ?", href: "/qui-sommes-nous" },
      ...INTERVENTION_POLES.map((pole) => ({ label: `Pôle ${pole.name.toLowerCase()}`, href: `/qui-sommes-nous#${pole.slug}` })),
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

const whatsappHref = `https://wa.me/${COMPANY.phone.replace(/\D/g, "")}`;
const linkClass = "rounded-sm text-[0.92rem] text-night-100 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 bg-night-900 text-white">
      {/* Bandeau d'appel : la promesse de la maison */}
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="font-display text-2xl font-medium italic leading-snug sm:text-[1.7rem]">« {COMPANY.slogan}. »</p>
            <p className="mt-2 text-sm text-night-200">Une idée, un manuscrit, un projet institutionnel ? Parlons-en.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/formation-editoriale" className="cta-primary inline-flex h-11 items-center justify-center px-5 text-sm">Présenter mon projet</Link>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-sm border border-white/25 px-5 text-sm font-semibold transition hover:bg-white/10">
              <MessageCircle aria-hidden="true" className="h-4 w-4" /> Écrire sur WhatsApp
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-24 pt-12 sm:px-6 lg:px-8 lg:pb-12">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_repeat(4,1fr)]">
          <div>
            <Wordmark tone="light" tagline />
            <address className="mt-6 space-y-3 text-sm not-italic leading-6 text-night-100">
              <p className="flex items-start gap-2.5"><MapPin aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-brand-300" /><span>{COMPANY.address.map((line) => <span key={line} className="block">{line}</span>)}</span></p>
              <a href={COMPANY.phoneHref} className="flex items-center gap-2.5 font-semibold text-white hover:underline"><Phone aria-hidden="true" className="h-4 w-4 text-brand-300" />{COMPANY.phone}</a>
              <a href={`mailto:${COMPANY.email}`} className="block pl-[1.6rem] hover:text-white hover:underline">{COMPANY.email}</a>
            </address>
            <p className="mt-6 text-xs text-night-300">Présents en {COMPANY.countries.join(" · ")}</p>
          </div>

          {/* Bureau : colonnes */}
          {footerGroups.map((group) => (
            <div key={group.title} className="hidden lg:block">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Ribbon className="h-3.5 w-2" />{group.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((item) => (
                  <li key={item.href}><Link href={item.href} className={linkClass}>{item.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}

          {/* Mobile : accordéons */}
          <div className="divide-y divide-white/10 border-y border-white/10 lg:hidden">
            {footerGroups.map((group) => (
              <details key={group.title} className="group">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between font-display text-lg font-semibold [&::-webkit-details-marker]:hidden">
                  {group.title}
                  <ChevronDown aria-hidden="true" className="h-4 w-4 text-night-200 transition-transform group-open:rotate-180" />
                </summary>
                <ul className="space-y-1 pb-4">
                  {group.links.map((item) => (
                    <li key={item.href}><Link href={item.href} className={`${linkClass} flex min-h-10 items-center`}>{item.label}</Link></li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </div>
      </div>

      {/* Colophon */}
      <div className="border-t border-white/10 bg-night-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 pb-24 text-xs text-night-200 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:pb-6">
          <p>© {year} {COMPANY.name} — {COMPANY.group}. Tous droits réservés.</p>
          <nav aria-label="Informations légales" className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-white hover:underline">{link.label}</Link>
            ))}
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="inline-flex items-center gap-1.5 font-semibold text-white transition hover:text-brand-300">
              Haut de page <ArrowUp aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          </nav>
        </div>
      </div>
    </footer>
  );
}
