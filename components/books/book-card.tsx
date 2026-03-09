"use client";

import Link from "next/link";

type Book = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  cover_signed_url?: string | null;
  author_name?: string;
};

export function BookCard({ book }: { book: Book }) {
  const coverUrl = book.cover_signed_url ?? null;

  return (
    <article className="ios-surface ios-card-hover rounded-[1.75rem] p-4">
      <div className="mb-3 h-40 overflow-hidden rounded-[1.25rem] bg-slate-100/80">
        {coverUrl ? (
          <img src={coverUrl} alt={book.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center px-3 text-center text-sm text-slate-500">{book.title}</div>
        )}
      </div>
      <h2 className="ios-title text-lg font-semibold">{book.title}</h2>
      <p className="mt-1 text-xs text-slate-500">{book.author_name ?? "Auteur inconnu"}</p>
      <p className="mt-1 line-clamp-2 text-sm ios-muted">{book.description ?? "No description"}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="font-medium text-rose-700">{book.price <= 0 ? "Gratuit" : `$${book.price.toFixed(2)}`}</span>
        <Link href={`/book/${book.id}`} className="ios-button-secondary rounded-full px-4 py-2 text-sm font-medium">
          View
        </Link>
      </div>
    </article>
  );
}
