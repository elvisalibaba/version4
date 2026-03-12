"use client";

import Link from "next/link";
import type { PublishedBook } from "@/lib/books";

type FreeBooksMarqueeSectionProps = {
  books: PublishedBook[];
};

export function FreeBooksMarqueeSection({ books }: FreeBooksMarqueeSectionProps) {
  const freeBooks = books.filter((book) => book.price <= 0);
  const marqueeBooks = freeBooks.length > 0 ? freeBooks : books.slice(0, 8);

  if (marqueeBooks.length === 0) return null;

  const loopBooks = [...marqueeBooks, ...marqueeBooks];

  return (
    <section className="hb-section">
      <div className="hb-section-shell">
        <div className="hb-shelf-panel hb-marquee-panel">
          <div className="hb-shelf-header">
            <div className="hb-shelf-title">
              <span className="hb-shelf-kicker">Livres gratuits</span>
              <p className="hb-shelf-subtitle">Des lectures libres, sans frais, disponibles tout de suite.</p>
            </div>
            <div className="hb-shelf-actions">
              <span className="hb-shelf-count">{freeBooks.length > 0 ? freeBooks.length : marqueeBooks.length} livres</span>
              <Link href="/librairie" className="hb-button-ghost">
                Voir tout
              </Link>
            </div>
          </div>

          <div className="hb-marquee" aria-label="Defilement des livres gratuits">
            <div className="hb-marquee-track">
              {loopBooks.map((book, index) => (
                <div key={`${book.id}-${index}`} className="hb-marquee-item" aria-hidden={index >= marqueeBooks.length}>
                  <Link href={`/book/${book.id}`} className="hb-book-tile">
                    <div className="hb-book-cover">
                      {book.cover_signed_url ? (
                        <img src={book.cover_signed_url} alt={book.title} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                      ) : (
                        <div className="hb-book-fallback">{book.title}</div>
                      )}
                    </div>
                    <div className="hb-book-overlay">
                      <p className="hb-book-title">{book.title}</p>
                      <span className="hb-book-price">Gratuit</span>
                      <span className="hb-book-cta">Lire maintenant</span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
