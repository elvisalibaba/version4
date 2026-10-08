"use client";

import Link from "next/link";
import { ArrowUp, ChevronDown, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { buttonClasses, ButtonLink } from "@/components/ui/button";
import { COMPANY, INTERVENTION_POLES } from "@/lib/holistique";

type FooterLink = { label: string; href: string };

const footerGroups: Array<{ title: string; links: FooterLink[] }> = [
  {
    title: "Entreprise",
    links: [
      { label: "À propos", href: "/qui-sommes-nous" },
      ...INTERVENTION_POLES.map((pole) => ({ label: `Pôle ${pole.name.toLowerCase()}`, href: `/qui-sommes-nous#${pole.slug}` })),
      { label: "Questions fréquentes", href: "/faq" },
      { label: "Soutenir le projet", href: "/don" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Services éditoriaux", href: "/services" },
      { label: "Packs d’édition", href: "/home#packs" },
      { label: "Académie", href: "/formation-editoriale" },
      { label: "Ressources pour auteurs", href: "/ressources" },
      { label: "Publier mon livre", href: "/register?role=author" },
    ],
  },
  {
    title: "Librairie",
    links: [
      { label: "Catalogue", href: "/librairie" },
      { label: "Lire gratuitement", href: "/librairie?is_free=1" },
      { label: "Élèves & étudiants", href: "/education" },
      { label: "Auteurs", href: "/authors" },
      { label: "Magazines", href: "/blog" },
    ],
  },
  {
    title: "Mon compte",
    links: [
      { label: "Espace lecteur", href: "/dashboard/reader" },
      { label: "Ma bibliothèque", href: "/dashboard/reader/library" },
      { label: "Abonnements", href: "/dashboard/reader/subscriptions" },
      { label: "Espace auteur", href: "/dashboard/author" },
      { label: "Panier", href: "/cart" },
    ],
  },
];

const legalLinks: FooterLink[] = [
  { label: "Conditions d’utilisation", href: "/conditions" },
  { label: "Confidentialité", href: "/confidentialite" },
  { label: "Cookies", href: "/cookies" },
];

const whatsappHref = `https://wa.me/${COMPANY.phone.replace(/\D/g, "")}`;
const linkClass = "inline-flex min-h-11 items-center rounded-sm text-[0.92rem] text-muted-dark transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-14 sm:px-6 lg:px-8 lg:pb-12">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Logo tone="dark" height={40} />
            <p className="mt-5 font-display text-[0.95rem] font-bold text-brand-soft">{COMPANY.slogan}</p>
            <address className="mt-6 space-y-2 text-sm not-italic leading-6 text-muted-dark">
              <p className="flex items-start gap-2.5"><MapPin aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-brand-soft" /><span>{COMPANY.address.join(", ")}</span></p>
              <a href={COMPANY.phoneHref} className="flex min-h-11 items-center gap-2.5 font-semibold text-white hover:underline"><Phone aria-hidden="true" className="h-4 w-4 text-brand-soft" />{COMPANY.phone}</a>
              <a href={`mailto:${COMPANY.email}`} className="flex min-h-11 items-center gap-2.5 hover:text-white hover:underline"><Mail aria-hidden="true" className="h-4 w-4 text-brand-soft" />{COMPANY.email}</a>
            </address>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/home#contact" variant="on-dark">Présenter mon projet</ButtonLink>
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: "outline-on-dark" })}>
                <MessageCircle aria-hidden="true" /> WhatsApp
              </a>
            </div>
          </div>

          {/* Bureau : colonnes */}
          {footerGroups.map((group) => (
            <div key={group.title} className="hidden lg:block">
              <h2 className="font-display text-sm font-bold uppercase tracking-[0.12em] text-white">{group.title}</h2>
              <ul className="mt-4 space-y-1">
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
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between font-display text-sm font-bold uppercase tracking-[0.12em] [&::-webkit-details-marker]:hidden">
                  {group.title}
                  <ChevronDown aria-hidden="true" className="h-4 w-4 text-muted-dark transition-transform group-open:rotate-180" />
                </summary>
                <ul className="pb-4">
                  {group.links.map((item) => (
                    <li key={item.href}><Link href={item.href} className={`${linkClass} flex min-h-11`}>{item.label}</Link></li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 pb-24 text-xs text-muted-dark sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:pb-6">
          <p>© {year} {COMPANY.name} · {COMPANY.group} · Kinshasa, RDC</p>
          <p>Paiement sécurisé · Lecture sur mobile, tablette et ordinateur</p>
          <nav aria-label="Informations légales" className="flex flex-wrap items-center gap-x-5 gap-y-1">
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="inline-flex min-h-11 items-center transition-colors hover:text-white hover:underline">{link.label}</Link>
            ))}
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-white transition-colors hover:text-brand-soft">
              Haut de page <ArrowUp aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          </nav>
        </div>
      </div>
    </footer>
  );
}
