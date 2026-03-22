"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { FavoriteBookButton } from "@/components/books/favorite-book-button";

type Book = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  currency_code?: string;
  display_price_label?: string;
  cover_signed_url?: string | null;
  author_name?: string;
  rating_avg?: number | null;
  ratings_count?: number | null;
  is_free?: boolean;
  is_favorite?: boolean;
  offer_summary_label?: string;
};

function buildStars(rating?: number | null) {
  if (!rating || rating <= 0) {
    return Array.from({ length: 5 }, () => false);
  }

  const rounded = Math.max(0, Math.min(5, Math.round(rating)));
  return Array.from({ length: 5 }, (_, index) => index < rounded);
}

export function BookCard({ book }: { book: Book }) {
  const priceLabel =
    book.display_price_label ?? (book.price <= 0 ? "Gratuit" : `${book.price.toFixed(2)} ${book.currency_code ?? "USD"}`);
  const stars = buildStars(book.rating_avg);
  const ctaLabel = book.is_free ? "Lire maintenant" : "Voir le livre";
  const eyebrowLabel = book.offer_summary_label ?? (book.is_free ? "Lecture gratuite" : "eBook");
  const ratingLabel =
    book.rating_avg && book.rating_avg > 0
      ? `${book.rating_avg.toFixed(1)}${book.ratings_count ? ` • ${book.ratings_count} avis` : ""}`
      : "Nouveau titre";
  const description =
    book.description?.trim() || "Une fiche plus propre pour afficher clairement le livre, son auteur et son mode d acces.";

  return (
    <article className="group flex h-full flex-col rounded-md border border-gray-200 bg-white shadow-sm transition hover:border-gray-300 hover:shadow-md">
      <div className="relative">
        <Link href={`/book/${book.id}`} className="block overflow-hidden rounded-t-md bg-gray-100" aria-label={`Voir ${book.title}`}>
          <div className="aspect-[0.74]">
            {book.cover_signed_url ? (
              <Image
                src={book.cover_signed_url}
                alt={book.title}
                width={420}
                height={580}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
              />
            ) : (
              <div className="grid h-full place-items-center px-4 text-center text-sm font-semibold text-gray-500">{book.title}</div>
            )}
          </div>
        </Link>
        <div className="absolute right-3 top-3">
          <FavoriteBookButton bookId={book.id} initialIsFavorite={book.is_favorite} compact />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="space-y-2">
          <p className="inline-flex w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            {eyebrowLabel}
          </p>
          <h3 className="text-base font-semibold leading-5 text-gray-900">
            <Link href={`/book/${book.id}`} className="hover:text-[#ff9900]">
              {book.title}
            </Link>
          </h3>
          <p className="text-sm text-gray-600">par {book.author_name ?? "Auteur inconnu"}</p>
        </div>

        <div className="mt-2 flex items-center gap-1">
          {stars.map((filled, index) => (
            <Star
              key={`${book.id}-${index}`}
              className={`h-4 w-4 ${filled ? "fill-current text-[#ff9900]" : "text-gray-300"}`}
            />
          ))}
          <span className="ml-1 text-xs text-gray-500">{ratingLabel}</span>
        </div>

        <p className="mt-3 line-clamp-3 text-sm text-gray-600">{description}</p>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-200 pt-4">
          <div>
            <p className="text-xs text-gray-500">{book.is_free ? "Acces" : "Prix"}</p>
            <p className="text-lg font-bold text-gray-900">{priceLabel}</p>
          </div>

          <Link
            href={`/book/${book.id}`}
            className="inline-flex h-9 items-center gap-1 rounded-md bg-[#ff9900] px-3 text-sm font-semibold text-white transition hover:bg-[#e68900]"
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
