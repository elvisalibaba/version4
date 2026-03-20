"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";

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
    <article className="group flex h-full flex-col rounded-[30px] border border-[#ece3d7] bg-white p-4 shadow-[0_18px_42px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:shadow-[0_24px_52px_rgba(15,23,42,0.08)]">
      <Link href={`/book/${book.id}`} className="block overflow-hidden rounded-[22px] bg-[#f5efe8]" aria-label={`Voir ${book.title}`}>
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
            <div className="grid h-full place-items-center px-4 text-center text-sm font-semibold text-[#6f665e]">{book.title}</div>
          )}
        </div>
      </Link>

      <div className="mt-4 flex flex-1 flex-col">
        <div className="space-y-2">
          <p className="inline-flex w-fit rounded-full bg-[#fff1ea] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#a85b3f]">
            {eyebrowLabel}
          </p>
          <h3 className="text-[1.1rem] font-semibold leading-6 tracking-[-0.03em] text-[#171717]">
            <Link href={`/book/${book.id}`}>{book.title}</Link>
          </h3>
          <p className="text-sm text-[#6f665e]">par {book.author_name ?? "Auteur inconnu"}</p>
        </div>

        <div className="mt-3 flex items-center gap-1">
          {stars.map((filled, index) => (
            <Star
              key={`${book.id}-${index}`}
              className={`h-3.5 w-3.5 ${filled ? "fill-current text-[#f3a81f]" : "text-[#ddd2c7]"}`}
            />
          ))}
          <span className="ml-1 text-xs font-medium text-[#8b8177]">{ratingLabel}</span>
        </div>

        <p className="mt-4 line-clamp-3 flex-1 text-sm leading-7 text-[#5d554d]">{description}</p>

        <div className="mt-5 flex items-end justify-between gap-3 border-t border-[#f1e8de] pt-4">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#8b8177]">{book.is_free ? "Acces" : "Prix"}</p>
            <p className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[#171717]">{priceLabel}</p>
          </div>

          <Link
            href={`/book/${book.id}`}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-[#171717] px-4 text-sm font-semibold text-white transition hover:bg-[#0f172a]"
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
