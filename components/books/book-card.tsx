"use client";

import Link from "next/link";

type Book = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  display_price_label?: string;
  offer_summary_label?: string;
  cover_signed_url?: string | null;
  author_name?: string;
};

export function BookCard({ book }: { book: Book }) {
  const coverUrl = book.cover_signed_url ?? null;
  const priceLabel = book.display_price_label ?? (book.price <= 0 ? "Gratuit" : `$${book.price.toFixed(2)}`);

  return (
    <article className="catalog-card group">
      <div className="catalog-cover">
        <span className="catalog-badge catalog-badge-floating">{book.offer_summary_label ?? "Lecture utile"}</span>
        {coverUrl ? (
          <img src={coverUrl} alt={book.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]" />
        ) : (
          <div className="flex h-full items-center justify-center px-3 text-center text-sm font-semibold text-slate-500">{book.title}</div>
        )}
        <div className="catalog-cover-footer">
          <div>
            <p className="catalog-author">{book.author_name ?? "Auteur inconnu"}</p>
            <p className="catalog-format">Edition numerique</p>
          </div>
          <span className="catalog-price">{priceLabel}</span>
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="section-title text-xl">{book.title}</h2>
        <p className="line-clamp-3 text-sm leading-6 text-slate-500">
          {book.description ?? "Un livre de transformation pour nourrir la clarte, la foi et le passage a l action."}
        </p>
      </div>
      <div className="mt-auto flex items-center justify-between gap-3">
        <span className="catalog-format">{book.offer_summary_label ?? "Transformation"}</span>
        <Link href={`/book/${book.id}`} className="cta-secondary px-4 py-2 text-sm">
          Decouvrir
        </Link>
      </div>
    </article>
  );
}
