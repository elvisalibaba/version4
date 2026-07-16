import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpenText, LayoutPanelTop, PenSquare, ShieldCheck } from "lucide-react";

const marketReferences = [
  { name: "Kobo", label: "Lecture premium" },
  { name: "Amazon KDP", label: "Edition auteur" },
  { name: "Apple Books", label: "Catalogue premium" },
  { name: "Google Play Books", label: "Multi-support" },
  { name: "IngramSpark", label: "Diffusion editoriale" },
  { name: "Draft2Digital", label: "Distribution agile" },
];

const pillars = [
  {
    icon: LayoutPanelTop,
    title: "Vitrine premium",
    description: "Une home plus claire, plus editoriale et beaucoup plus vendeuse.",
  },
  {
    icon: BookOpenText,
    title: "Lecture plus fluide",
    description: "Des livres mieux presentes, plus simples a explorer et a reprendre.",
  },
  {
    icon: PenSquare,
    title: "Espace auteur credible",
    description: "Un espace auteur plus solide pour publier, vendre et piloter son catalogue avec precision.",
  },
];

export function MarketPositionSection() {
  return (
    <section className="hb-market-section">
      <div className="hb-section-shell">
        <div className="hb-market-shell">
          <div className="hb-market-panel">
            <div className="hb-market-copy">
              <div className="space-y-4">
                <p className="hb-market-kicker">Standards mondiaux</p>
                <h2 className="hb-market-title">Holistique Books vise la stature visuelle des grandes plateformes du livre.</h2>
                <p className="hb-market-text">
                  Une librairie premium pour les lecteurs. Un studio auteur plus serieux pour publier, vendre et faire grandir son catalogue avec confiance.
                </p>
              </div>

              <div className="hb-market-actions">
                <Link href="/books" className="hb-market-primary">
                  Explorer la librairie
                </Link>
                <Link href="/dashboard/author" className="hb-market-secondary">
                  Voir le studio auteur
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="hb-market-hero-card">
              <span className="hb-market-hero-badge">
                <ShieldCheck className="h-4 w-4" />
                Ambition premium
              </span>
              <p className="hb-market-hero-heading">Une experience qui doit paraitre serieuse, nette et desirable des le premier regard.</p>
              <p className="hb-market-hero-copy">
                Design plus propre, hierarchie plus forte, produits mieux mis en avant et espace auteur plus professionnel.
              </p>
              <div className="hb-market-hero-media">
                <Image
                  src="/images/ce2.jpg"
                  alt="Mise en avant premium de livres Holistique Books"
                  fill
                  sizes="(max-width: 1100px) 100vw, 420px"
                  className="object-cover"
                />
                <div className="hb-market-hero-media-copy">
                  <p className="hb-market-hero-media-label">Vitrine premium</p>
                  <p className="hb-market-hero-media-text">Produits bien exposes, parcours clair et espace auteur plus professionnel.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="hb-market-reference-shell">
            <div className="hb-market-reference-head">
              <p className="hb-market-reference-kicker">References du secteur</p>
              <p className="hb-market-reference-title">Kobo, Amazon KDP et 4 autres standards du livre numerique.</p>
              <p className="hb-market-reference-text">
                Une bande de credibilite construite comme un vrai bloc marquee: plus nette, plus dense, plus premium.
              </p>
            </div>

            <div className="hb-market-logo-grid">
              {marketReferences.map((item) => (
                <article key={item.name} className="hb-market-logo-card">
                  <p className="hb-market-logo-name">{item.name}</p>
                  <p className="hb-market-logo-label">{item.label}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="hb-market-pillars">
            {pillars.map(({ icon: Icon, title, description }) => (
              <article key={title} className="hb-market-pillar">
                <span className="hb-market-pillar-icon">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="hb-market-pillar-title">{title}</h3>
                  <p className="hb-market-pillar-text">{description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
