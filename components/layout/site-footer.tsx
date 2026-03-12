import Link from "next/link";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="hb-footer">
      <div className="hb-section-shell">
        <div className="hb-footer-grid">
          <div className="hb-footer-column">
            <p className="hb-footer-title">Parcourir</p>
            <Link href="/librairie" className="hb-footer-link">
              Librairie
            </Link>
            <Link href="/books" className="hb-footer-link">
              Auteurs
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
            <Link href="/ressources" className="hb-footer-link">
              Conditions
            </Link>
            <Link href="/ressources" className="hb-footer-link">
              Confidentialite
            </Link>
            <Link href="/ressources" className="hb-footer-link">
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
