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
      <div className="hb-card-cover relative">
        <Link
          href={href}
          onClick={trackClick}
          aria-label={`Découvrir ${book.title}`}
          className="hb-book block aspect-2/3 bg-paper-deep"
        >
          {book.cover_signed_url ? (
            <Image src={book.cover_signed_url} alt={`Couverture de ${book.title}`} fill priority={priority} sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 200px" className="object-cover" />
          ) : (
            <div className="flex h-full flex-col bg-night-900 px-4 pb-4 pt-0 text-white">
              <span className="ml-auto h-7 w-3.5 bg-brand-600 [clip-path:polygon(0_0,100%_0,100%_100%,50%_78%,0_100%)]" aria-hidden="true" />
              <strong className="mt-auto line-clamp-4 font-display text-lg font-semibold leading-snug">{book.title}</strong>
              <span className="mt-2 h-px w-8 bg-night-400" aria-hidden="true" />
              <span className="mt-2 line-clamp-1 font-display text-xs italic text-night-200">{book.author_name ?? "Auteur Holistique"}</span>
            </div>
          )}
        </Link>
        {book.is_free ? (
          <span className="absolute left-0 top-3 z-10 bg-brand-600 py-0.5 pl-2.5 pr-2 text-[0.68rem] font-semibold uppercase tracking-wider text-white">Gratuit</span>
        ) : null}
        <div className="absolute right-2 top-2 z-10">
          <FavoriteBookButton bookId={book.id} initialIsFavorite={book.is_favorite} compact />
        </div>
      </div>

      <div className="mt-3 flex flex-1 flex-col gap-1">
        <h3 className="line-clamp-2 font-display text-[1.02rem] font-semibold leading-snug text-night-900">
          <Link href={href} onClick={trackClick} className="hb-link">{book.title}</Link>
        </h3>
        <p className="line-clamp-1 text-[0.8rem] italic text-slate-600">{book.author_name ?? "Auteur Holistique"}</p>
        <Rating value={book.rating_avg} count={book.ratings_count} />
        <p className="mt-auto pt-1 text-[0.95rem] font-semibold tabular-nums text-night-900">
          {book.is_free ? <span className="text-emerald-700">Gratuit</span> : price}
        </p>
        {book.offer_summary_label && !book.is_free ? (
          <p className="text-xs text-slate-500">{book.offer_summary_label}</p>
        ) : null}
      </div>
    </article>
  );
}
