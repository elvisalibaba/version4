import Link from "next/link";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";

export function SiteFooter() {
  const footerColumns = [
    {
      title: "Navigate",
      links: [
        { label: "Home", href: "/home" },
        { label: "Books", href: "/books" },
        { label: "Blog", href: "/blog" },
        { label: "FAQ", href: "/faq" },
        { label: "Contact", href: "/home#contact" },
      ],
    },
    {
      title: "Collections",
      links: [
        { label: "Livres gratuits", href: "/books?access=free" },
        { label: "Popular books", href: "/home#popular-books" },
        { label: "Explorer par auteur", href: "/home#authors" },
        { label: "Nouveautes", href: "/books" },
      ],
    },
    {
      title: "Writer side",
      links: [
        { label: "Studio auteur", href: "/dashboard/author" },
        { label: "Publier un livre", href: "/dashboard/author/add-book" },
        { label: "Ventes auteur", href: "/dashboard/author/sales" },
        { label: "Guide auteur", href: "/faq#auteurs" },
        { label: "Creer un compte", href: "/register" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Conditions", href: "/conditions" },
        { label: "Confidentialite", href: "/confidentialite" },
        { label: "Cookies", href: "/cookies" },
      ],
    },
  ];

  return (
    <footer className="hb-footer">
      <div className="hb-section-shell">
        <div className="hb-footer-callout">
          <div className="hb-footer-brand-block">
            <p className="hb-kicker">Holistique Books</p>
            <h2 className="hb-title text-3xl sm:text-4xl">Une librairie premium pour lire, publier et faire rayonner des livres qui transforment.</h2>
            <p className="hb-muted max-w-3xl text-sm sm:text-base">
              Parcourez des livres numeriques et physiques, decouvrez des auteurs credibles et avancez dans une experience de lecture plus claire, plus sobre et plus professionnelle.
            </p>
          </div>

          <div className="hb-footer-callout-actions">
            <Link href="/books" className="cta-primary px-5 py-3 text-sm">
              Explorer la librairie
            </Link>
            <Link href="/dashboard/author" className="cta-secondary px-5 py-3 text-sm">
              Ouvrir le studio auteur
            </Link>
          </div>
        </div>

        <div className="hb-footer-grid">
          <div className="hb-footer-column hb-footer-column-brand">
            <Link href="/home" className="hb-logo">
              <span className="dashboard-brand-mark">HB</span>
              <span className="hb-logo-copy">
                <span className="hb-logo-kicker">Read, publish, elevate</span>
                <span className="hb-logo-title">Holistique Books</span>
              </span>
            </Link>
            <p className="text-sm leading-7 text-slate-500">
              Plateforme de livres inspirants, pratiques et accessibles sur le web, avec une experience editoriale plus rassurante pour les lecteurs comme pour les auteurs.
            </p>
            <p className="text-sm font-semibold text-slate-900">contact@holistiquebooks.africa</p>
            <div className="flex items-center gap-2">
              {[Facebook, Instagram, Twitter, Linkedin].map((Icon, index) => (
                <span key={index} className="hb-social-icon">
                  <Icon className="h-4 w-4" />
                </span>
              ))}
            </div>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title} className="hb-footer-column">
              <p className="hb-footer-title">{column.title}</p>
              {column.links.map((link) => (
                <Link key={link.label} href={link.href} className="hb-footer-link">
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
