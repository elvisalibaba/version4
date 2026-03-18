"use client";

import Link from "next/link";
import { Star } from "lucide-react";

type Book = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  display_price_label?: string;
  cover_signed_url?: string | null;
  author_name?: string;
  rating_avg?: number | null;
  ratings_count?: number | null;
  is_free?: boolean;
};

function buildStars(rating?: number | null) {
  if (!rating || rating <= 0) {
    return Array.from({ length: 5 }, () => false);
  }

  const rounded = Math.max(0, Math.min(5, Math.round(rating)));
  return Array.from({ length: 5 }, (_, index) => index < rounded);
}

export function BookCard({ book }: { book: Book }) {
  const coverUrl = book.cover_signed_url ?? null;
  const priceLabel = book.display_price_label ?? (book.price <= 0 ? "Gratuit" : `$${book.price.toFixed(2)}`);
  const stars = buildStars(book.rating_avg);
  const ctaLabel = book.is_free ? "Lire gratuitement" : "Voir le livre";
  const eyebrowLabel = book.is_free ? "Lecture offerte" : "Edition premium";
  const ratingLabel =
    book.rating_avg && book.rating_avg > 0
      ? `${book.rating_avg.toFixed(1)}${book.ratings_count ? ` - ${book.ratings_count} avis` : ""}`
      : "Nouveau titre";
  const description =
    book.description?.trim() || "Une lecture soigneusement presentee pour decouvrir le titre, l auteur et l intention du livre en un coup d oeil.";

  return (
    <article className="hb-template-book-card group">
      <Link href={`/book/${book.id}`} className="hb-template-book-cover-shell" aria-label={`Voir ${book.title}`}>
        <div className="hb-template-book-cover">
          {coverUrl ? (
            <img src={coverUrl} alt={book.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center text-sm font-semibold text-slate-500">{book.title}</div>
          )}
        </div>
      </Link>

      <div className="hb-template-book-body">
        <div className="hb-template-book-header">
          <p className="hb-template-book-eyebrow">{eyebrowLabel}</p>
          <h3 className="hb-template-book-title">
            <Link href={`/book/${book.id}`}>{book.title}</Link>
          </h3>
          <p className="hb-template-book-author">par {book.author_name ?? "Auteur inconnu"}</p>
        </div>

        <div className="hb-template-book-rating">
          {stars.map((filled, index) => (
            <Star key={`${book.id}-${index}`} className={`h-3.5 w-3.5 ${filled ? "fill-current text-[#f3a81f]" : "text-[#d9d3ca]"}`.trim()} />
          ))}
          <span className="hb-template-book-rating-text">{ratingLabel}</span>
        </div>

        <p className="hb-template-book-description line-clamp-3">{description}</p>

        <div className="hb-template-book-footer">
          <div className="hb-template-book-price-stack">
            <span className="hb-template-book-price-label">{book.is_free ? "Acces" : "Prix"}</span>
            <p className="hb-template-book-price">{priceLabel}</p>
          </div>

          <Link href={`/book/${book.id}`} className="hb-template-book-button">
            {ctaLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}
