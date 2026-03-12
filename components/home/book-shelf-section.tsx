"use client";

import Link from "next/link";
import { useRef } from "react";
import type { PublishedBook } from "@/lib/books";

type BookShelfSectionProps = {
  title: string;
  subtitle?: string;
  books: PublishedBook[];
};

export function BookShelfSection({ title, subtitle, books }: BookShelfSectionProps) {
  if (books.length === 0) return null;

  const scrollerRef = useRef<HTMLDivElement>(null);

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
              <span className="hb-shelf-count">{books.length} books</span>
              <button type="button" className="hb-shelf-arrow" aria-label="Precedent" onClick={() => handleScroll("prev")}>
                &#x2039;
              </button>
              <button type="button" className="hb-shelf-arrow" aria-label="Suivant" onClick={() => handleScroll("next")}>
                &#x203A;
              </button>
            </div>
          </div>

          <div ref={scrollerRef} className="hb-shelf-row">
            {books.map((book) => {
              const priceLabel = book.price <= 0 ? "Gratuit" : `$${book.price.toFixed(2)}`;

              return (
                <Link key={book.id} href={`/book/${book.id}`} className="hb-book-tile group">
                  <div className="hb-book-cover">
                    {book.cover_signed_url ? (
                      <img src={book.cover_signed_url} alt={book.title} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                    ) : (
                      <div className="hb-book-fallback">{book.title}</div>
                    )}
                  </div>
                  <div className="hb-book-overlay">
                    <p className="hb-book-title">{book.title}</p>
                    <span className="hb-book-price">{priceLabel}</span>
                    <span className="hb-book-cta">Details du livre</span>
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
