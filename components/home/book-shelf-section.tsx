"use client";

import Link from "next/link";
import { useRef } from "react";
import type { PublishedBook } from "@/lib/books";

type BookShelfSectionProps = {
  title: string;
  subtitle?: string;
  books: PublishedBook[];
  variant?: "default" | "comingSoon";
  size?: "default" | "compact";
};

function formatReleaseLabel(publicationDate?: string | null) {
  if (!publicationDate) return "Annonce bientot";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${publicationDate}T12:00:00Z`));
}

export function BookShelfSection({ title, subtitle, books, variant = "default", size = "default" }: BookShelfSectionProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (books.length === 0) return null;

  const handleScroll = (direction: "prev" | "next") => {
    if (!scrollerRef.current) return;
    const amount = scrollerRef.current.clientWidth * 0.7;
    scrollerRef.current.scrollBy({ left: direction === "next" ? amount : -amount, behavior: "smooth" });
  };

  return (
    <section className="hb-section hb-shelf-template">
      <div className="hb-section-shell">
        <div className="hb-shelf-panel">
          <div className="hb-shelf-header">
            <div className="hb-shelf-title">
              <span className="hb-shelf-kicker">{title}</span>
              {subtitle ? <p className="hb-shelf-subtitle">{subtitle}</p> : null}
            </div>
            <div className="hb-shelf-actions">
              <span className="hb-shelf-count">{books.length} titres</span>
              <button type="button" className="hb-shelf-arrow" aria-label="Precedent" onClick={() => handleScroll("prev")}>
                &#x2039;
              </button>
              <button type="button" className="hb-shelf-arrow" aria-label="Suivant" onClick={() => handleScroll("next")}>
                &#x203A;
              </button>
            </div>
          </div>

          <div ref={scrollerRef} className={`hb-shelf-row ${size === "compact" ? "is-compact" : ""}`.trim()}>
            {books.map((book, index) => {
              const priceLabel =
                variant === "comingSoon"
                  ? `Sortie ${formatReleaseLabel(book.publication_date)}`
                  : book.display_price_label ?? (book.price <= 0 ? "Gratuit" : `$${book.price.toFixed(2)}`);
              const accentLabel =
                variant === "comingSoon"
                  ? book.categories?.[0] ?? "Bientot disponible"
                  : book.offer_summary_label ?? book.categories?.[0] ?? "Selection premium";
              const ctaLabel = variant === "comingSoon" ? "Decouvrir" : "Voir";

              return (
                <Link key={book.id} href={`/book/${book.id}`} className={`hb-book-tile group ${size === "compact" ? "is-compact" : ""}`.trim()}>
                  <div className="hb-book-cover">
                    <span className="hb-book-rank">{String(index + 1).padStart(2, "0")}</span>
                    {book.cover_signed_url ? (
                      <img src={book.cover_signed_url} alt={book.title} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                    ) : (
                      <div className="hb-book-fallback">{book.title}</div>
                    )}
                  </div>
                  <div className="hb-book-meta">
                    <span className="hb-pill">{accentLabel}</span>
                    <p className="hb-book-title-line line-clamp-2">{book.title}</p>
                    <p className="hb-book-author-line">{book.author_name ?? "Auteur inconnu"}</p>
                    <div className="hb-book-footer">
                      <span className="hb-book-price">{priceLabel}</span>
                      <span className="hb-book-cta">{ctaLabel}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
