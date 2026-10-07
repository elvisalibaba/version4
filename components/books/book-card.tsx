"use client";

import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { FavoriteBookButton } from "@/components/books/favorite-book-button";
import { trackBookEngagement } from "@/lib/book-engagement-client";

type Book = { id: string; title: string; description: string | null; price: number; currency_code?: string; display_price_label?: string; cover_signed_url?: string | null; author_name?: string; rating_avg?: number | null; ratings_count?: number | null; is_free?: boolean; is_favorite?: boolean; offer_summary_label?: string };

function Rating({ value, count }: { value?: number | null; count?: number | null }) {
  if (!value) {
    return <p className="text-xs text-slate-500">Nouveauté</p>;
  }

  const rounded = Math.round(value);

  return (
    <p className="flex items-center gap-1.5 text-xs text-slate-600" aria-label={`Note ${value.toFixed(1)} sur 5`}>
      <span className="flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((index) => (
          <Star key={index} className={`h-3.5 w-3.5 ${index <= rounded ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`} />
        ))}
      </span>
      <span>{count ?? 0}</span>
    </p>
  );
}

export function BookCard({ book, priority = false }: { book: Book; priority?: boolean }) {
  const href = book.is_free ? `/book/${book.id}?read=1` : `/book/${book.id}`;
  const price = book.display_price_label ?? (book.price <= 0 ? "Gratuit" : `${book.price.toFixed(2)} ${book.currency_code ?? "USD"}`);
  const trackClick = () => trackBookEngagement({ bookId: book.id, eventType: "catalog_click", source: "book_card" });

  return (
    <article className="group flex min-w-0 flex-col">
      <div className="hb-card-cover relative rounded-md">
        <Link
          href={href}
          onClick={trackClick}
          aria-label={`Découvrir ${book.title}`}
          className="relative block aspect-2/3 overflow-hidden rounded-md border border-slate-200 bg-slate-100"
        >
          {book.cover_signed_url ? (
            <Image src={book.cover_signed_url} alt={`Couverture de ${book.title}`} fill priority={priority} sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 200px" className="object-cover" />
          ) : (
            <div className="flex h-full flex-col justify-end gap-2 bg-night-900 p-4 text-white">
              <span className="h-0.5 w-8 bg-brand-600" aria-hidden="true" />
              <strong className="line-clamp-4 text-lg font-bold leading-snug">{book.title}</strong>
              <span className="line-clamp-1 text-xs text-night-200">{book.author_name ?? "Auteur Holistique"}</span>
            </div>
          )}
        </Link>
        {book.is_free ? (
          <span className="absolute left-2 top-2 rounded-sm bg-brand-600 px-2 py-0.5 text-[0.7rem] font-semibold text-white">Gratuit</span>
        ) : null}
        <div className="absolute right-2 top-2">
          <FavoriteBookButton bookId={book.id} initialIsFavorite={book.is_favorite} compact />
        </div>
      </div>

      <div className="mt-3 flex flex-1 flex-col gap-1">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">
          <Link href={href} onClick={trackClick} className="hover:text-brand-700 hover:underline">{book.title}</Link>
        </h3>
        <p className="line-clamp-1 text-xs text-slate-600">{book.author_name ?? "Auteur Holistique"}</p>
        <Rating value={book.rating_avg} count={book.ratings_count} />
        <p className="mt-auto pt-1 text-base font-bold text-slate-900">
          {book.is_free ? <span className="text-emerald-700">Gratuit</span> : price}
        </p>
        {book.offer_summary_label && !book.is_free ? (
          <p className="text-xs text-slate-500">{book.offer_summary_label}</p>
        ) : null}
      </div>
    </article>
  );
}
