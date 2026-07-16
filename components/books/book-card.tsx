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
  const detailHref = `/book/${book.id}`;
  const actionHref = book.is_free ? `${detailHref}?read=1` : detailHref;
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
    <article className="group grid h-full grid-cols-[116px_minmax(0,1fr)] overflow-hidden rounded-2xl border border-[#eadfd4] bg-white shadow-sm transition hover:border-[#d9c9b9] hover:shadow-md sm:flex sm:flex-col">
      <div className="relative min-h-0">
        <Link
          href={detailHref}
          className="block h-full overflow-hidden bg-gray-100 sm:h-auto"
          aria-label={`Voir ${book.title}`}
        >
          <div className="h-full min-h-[218px] sm:aspect-[0.74] sm:min-h-0">
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
        <div className="absolute right-2 top-2 sm:right-3 sm:top-3">
          <FavoriteBookButton bookId={book.id} initialIsFavorite={book.is_favorite} compact />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
        <div className="space-y-1.5 sm:space-y-2">
          <p className="inline-flex w-fit max-w-full truncate rounded-full bg-[#f8f5f0] px-2.5 py-1 text-[0.68rem] font-semibold text-[#6f665e] sm:px-3 sm:text-xs">
            {eyebrowLabel}
          </p>
          <h3 className="line-clamp-2 text-sm font-bold leading-5 text-gray-900 sm:text-base sm:font-semibold">
            <Link href={detailHref} className="hover:text-[#ff9900]">
              {book.title}
            </Link>
          </h3>
          <p className="line-clamp-1 text-xs text-gray-600 sm:text-sm">par {book.author_name ?? "Auteur inconnu"}</p>
        </div>

        <div className="mt-2 flex min-w-0 items-center gap-0.5 sm:gap-1">
          {stars.map((filled, index) => (
            <Star
              key={`${book.id}-${index}`}
              className={`h-3 w-3 sm:h-4 sm:w-4 ${filled ? "fill-current text-[#ff7a5c]" : "text-gray-300"}`}
            />
          ))}
          <span className="ml-1 truncate text-[0.65rem] text-gray-500 sm:text-xs">{ratingLabel}</span>
        </div>

        <p className="mt-3 hidden text-sm text-gray-600 sm:line-clamp-3">{description}</p>

        <div className="mt-auto flex items-end justify-between gap-2 border-t border-gray-200 pt-3 sm:mt-4 sm:gap-3 sm:pt-4">
          <div>
            <p className="text-xs text-gray-500">{book.is_free ? "Acces" : "Prix"}</p>
            <p className="line-clamp-1 text-sm font-bold text-gray-900 sm:text-lg">{priceLabel}</p>
          </div>

          <Link
            href={actionHref}
            className="inline-flex h-10 shrink-0 items-center gap-1 rounded-xl bg-[#ff7a5c] px-3 text-xs font-bold text-white transition hover:bg-[#e96649] sm:h-9 sm:text-sm"
          >
            <span className="sm:hidden">{book.is_free ? "Lire" : "Voir"}</span>
            <span className="hidden sm:inline">{ctaLabel}</span>
            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
