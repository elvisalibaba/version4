import Link from "next/link";
import type { PublishedBook } from "@/lib/books";

type HeroSectionProps = {
  books: PublishedBook[];
};

export function HeroSection({ books }: HeroSectionProps) {
  const featuredTitle = books[0]?.title ?? "Collection Coup de Coeur";

  return (
    <section className="hb-section">
      <div className="hb-section-shell">
        <div className="hb-hero-slider">
          <div className="hb-hero-media" data-image-slot="hero-main">
            <span className="hb-hero-placeholder">Image slider principale</span>
          </div>
          <div className="hb-hero-panel">
            <p className="hb-hero-eyebrow">Evenement</p>
            <h1 className="hb-hero-title">Decouvrez {featuredTitle}.</h1>
            <p className="hb-hero-subtitle">Une mise en avant visuelle, courte et impactante.</p>
            <Link href="/librairie" className="hb-button-primary hb-hero-cta">
              Voir l&apos;evenement
            </Link>
          </div>
        </div>
        <div className="hb-hero-dots">
          <span className="hb-hero-dot is-active" />
          <span className="hb-hero-dot" />
          <span className="hb-hero-dot" />
        </div>
      </div>
    </section>
  );
}
