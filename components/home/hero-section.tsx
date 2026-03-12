"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { PublishedBook } from "@/lib/books";

type HeroSectionProps = {
  books: PublishedBook[];
};

export function HeroSection({ books }: HeroSectionProps) {
  const featuredTitle = books[0]?.title ?? "Collection Coup de Coeur";
  const heroImages = useMemo(() => ["/images/ce1.png", "/images/ce2.png", "/images/ce3.png"], []);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (heroImages.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % heroImages.length);
    }, 5200);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  return (
    <section className="hb-section">
      <div className="hb-section-shell">
        <div className="hb-hero-slider">
          <div className="hb-hero-media" data-image-slot="hero-main">
            {heroImages.map((src, index) => (
              <div key={src} className={`hb-hero-slide ${index === activeIndex ? "is-active" : ""}`}>
                <Image
                  src={src}
                  alt={`Visuel hero ${index + 1}`}
                  fill
                  priority={index === 0}
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="hb-hero-image"
                />
              </div>
            ))}
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
          {heroImages.map((_, index) => (
            <button
              key={`hero-dot-${index}`}
              type="button"
              className={`hb-hero-dot ${index === activeIndex ? "is-active" : ""}`}
              aria-label={`Aller au visuel ${index + 1}`}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
