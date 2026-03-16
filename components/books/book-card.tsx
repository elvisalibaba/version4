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
  const ctaLabel = book.is_free ? "Lire Gratuit" : "Add To Cart";

  return (
    <article className="hb-template-book-card group">
      <div className="hb-template-book-cover-shell">
        <div className="hb-template-book-cover">
          {coverUrl ? (
            <img src={coverUrl} alt={book.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center text-sm font-semibold text-slate-500">{book.title}</div>
          )}
        </div>
      </div>

      <div className="hb-template-book-body">
        <h3 className="hb-template-book-title">{book.title}</h3>
        <p className="hb-template-book-author">by {book.author_name ?? "Auteur inconnu"}</p>

        <div className="hb-template-book-rating">
          {stars.map((filled, index) => (
            <Star key={`${book.id}-${index}`} className={`h-3.5 w-3.5 ${filled ? "fill-current text-[#f3a81f]" : "text-[#d9d3ca]"}`.trim()} />
          ))}
        </div>

        <p className="hb-template-book-price">{priceLabel}</p>

        <Link href={`/book/${book.id}`} className="hb-template-book-button">
          {ctaLabel}
        </Link>
      </div>
    </article>
  );
}
