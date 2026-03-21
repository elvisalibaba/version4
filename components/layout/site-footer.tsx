"use client";

import Link from "next/link";
import {
  ArrowUp,
  BookOpen,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Youtube,
} from "lucide-react";
import {
  footerAboutLinks,
  footerAccountLinks,
  footerBlogLinks,
  footerLegalLinks,
  footerOpportunityLinks,
} from "@/lib/marketing-pages";

const socialNetworks = [
  { name: "Facebook", icon: Facebook, href: "https://facebook.com/holistique" },
  { name: "Instagram", icon: Instagram, href: "https://instagram.com/holistique" },
  { name: "YouTube", icon: Youtube, href: "https://youtube.com/holistique" },
  { name: "LinkedIn", icon: Linkedin, href: "https://linkedin.com/company/holistique" },
];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; href: string }>;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
        {title}
      </h3>

      <ul className="space-y-2.5">
        {links.map((item) => (
          <li key={`${title}-${item.href}`}>
            <Link
              href={item.href}
              className="text-sm leading-6 text-white/72 transition-colors duration-200 hover:text-[#febd69] focus:outline-none focus:ring-2 focus:ring-[#febd69] focus:ring-offset-2 focus:ring-offset-[#111827] rounded-sm"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();

  const discoverLinks = [
    ...(footerAboutLinks?.slice(0, 2) ?? []),
    ...(footerBlogLinks?.slice(0, 2) ?? []),
    ...(footerOpportunityLinks?.slice(0, 2) ?? []),
  ];

  const accountLinks = [
    ...(footerAccountLinks ?? []),
    { label: "Connexion", href: "/login" },
    { label: "Bibliothèque", href: "/library" },
  ];

  const servicesLinks = [
    { label: "Centre d’aide", href: "/faq" },
    { label: "Livraison", href: "/livraison" },
    { label: "Retours", href: "/retours" },
    { label: "Suivi de commande", href: "/commandes" },
  ];

  const companyLinks = [
    { label: "À propos", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Opportunités", href: "/opportunities" },
    { label: "Contact", href: "/contact" },
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative border-t border-white/10 bg-[#111827] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(254,189,105,0.07),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.03),transparent_18%)]" />

      <div className="relative z-10">
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Retour en haut de la page"
          className="group flex w-full items-center justify-center gap-2 border-b border-white/10 bg-white/[0.04] py-3 text-sm text-white/70 transition hover:bg-white/[0.07] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#febd69]"
        >
          <ArrowUp className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5" />
          Haut de page
        </button>

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.1fr_1fr_1fr_1fr]">
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#febd69] text-[#111827] shadow-sm">
                  <BookOpen className="h-5 w-5" />
                </span>

                <div>
                  <p className="text-sm font-semibold tracking-wide text-white">
                    Holistique Books
                  </p>
                  <p className="text-xs text-white/50">
                    Lire. Publier. Distribuer.
                  </p>
                </div>
              </div>

              <p className="max-w-xs text-sm leading-6 text-white/62">
                Plateforme éditoriale digitale pour lecteurs, auteurs et partenaires.
              </p>

              <div className="flex flex-wrap gap-2.5">
                {socialNetworks.map((social) => {
                  const Icon = social.icon;

                  return (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.name}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/70 transition hover:border-[#febd69]/40 hover:text-[#febd69] focus:outline-none focus:ring-2 focus:ring-[#febd69]"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            </div>

            <FooterColumn title="Découvrir" links={discoverLinks} />
            <FooterColumn title="Compte" links={accountLinks} />
            <FooterColumn title="Support" links={servicesLinks} />
          </div>

          <div className="mt-10 border-t border-white/10 pt-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/65 transition hover:text-[#febd69] focus:outline-none focus:ring-2 focus:ring-[#febd69]"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Français
                </button>

                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/65 transition hover:text-[#febd69] focus:outline-none focus:ring-2 focus:ring-[#febd69]"
                >
                  RDC
                </button>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/50">
                {footerLegalLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="transition hover:text-[#febd69] focus:outline-none focus:ring-2 focus:ring-[#febd69] rounded-sm"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 md:flex-row md:items-center md:justify-between">
              <div className="text-xs text-white/38">
                © {year} Holistique Books. Tous droits réservés.
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/38">
                {companyLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="transition hover:text-[#febd69] focus:outline-none focus:ring-2 focus:ring-[#febd69] rounded-sm"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}