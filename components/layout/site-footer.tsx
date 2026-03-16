import Link from "next/link";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="hb-footer">
      <div className="hb-section-shell">
        <div className="hb-footer-callout">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#ff8b91]">Livres qui transforment</p>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
                Des livres de foi, croissance personnelle et leadership pour toucher l esprit, le coeur et les decisions.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                Nous mettons en avant des lectures qui apportent clarte, paix interieure et passage a l action, dans une experience simple et premium.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/books" className="cta-secondary px-5 py-3 text-sm">
                Explorer le catalogue
              </Link>
              <Link href="/dashboard/author" className="cta-primary px-5 py-3 text-sm">
                Publier un livre
              </Link>
            </div>
          </div>

          <div className="hb-footer-metrics">
            <div className="hb-footer-metric">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Promesse</span>
              <strong>Transformation utile</strong>
            </div>
            <div className="hb-footer-metric">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Acces</span>
              <strong>Achat ou abonnement</strong>
            </div>
            <div className="hb-footer-metric">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Voix</span>
              <strong>Auteurs qui elevent</strong>
            </div>
          </div>
        </div>

        <div className="hb-footer-grid">
          <div className="hb-footer-column">
            <p className="hb-footer-title">Plateforme</p>
            <p className="text-sm leading-6 text-slate-500">
              Une librairie digitale centree sur les livres transformationnels: foi, clarte, leadership et croissance personnelle.
            </p>
          </div>
          <div className="hb-footer-column">
            <p className="hb-footer-title">Parcourir</p>
            <Link href="/librairie" className="hb-footer-link">
              Librairie
            </Link>
            <Link href="/books" className="hb-footer-link">
              Catalogue
            </Link>
            <Link href="/ressources" className="hb-footer-link">
              Ressources
            </Link>
          </div>
          <div className="hb-footer-column">
            <p className="hb-footer-title">A propos</p>
            <Link href="/qui-sommes-nous" className="hb-footer-link">
              Qui sommes-nous
            </Link>
            <Link href="/blog" className="hb-footer-link">
              Blog
            </Link>
            <Link href="/register" className="hb-footer-link">
              Ouvrir un compte
            </Link>
          </div>
          <div className="hb-footer-column">
            <p className="hb-footer-title">Legal</p>
            <Link href="/conditions" className="hb-footer-link">
              Conditions
            </Link>
            <Link href="/confidentialite" className="hb-footer-link">
              Confidentialite
            </Link>
            <Link href="/cookies" className="hb-footer-link">
              Cookies
            </Link>
          </div>
          <div className="hb-footer-column">
            <p className="hb-footer-title">Social</p>
            <div className="flex items-center gap-2">
              {[Facebook, Instagram, Twitter, Linkedin].map((Icon, index) => (
                <span key={index} className="hb-social-icon">
                  <Icon className="h-4 w-4" />
                </span>
              ))}
            </div>
            <p className="text-xs text-slate-500">contact@holistiquebooks.africa</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
