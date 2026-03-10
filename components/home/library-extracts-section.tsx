import Link from "next/link";
import { ArrowRight, BookOpenText, Library } from "lucide-react";
import type { PublishedBook } from "@/lib/books";

type LibraryExtractsSectionProps = {
  books: PublishedBook[];
};

export function LibraryExtractsSection({ books }: LibraryExtractsSectionProps) {
  const featured = books.slice(0, 1);
  const gridBooks = books.slice(1, 7);
  const categories = Array.from(new Set(books.flatMap((book) => book.categories ?? []))).slice(0, 6);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="ios-kicker">Bibliotheque</p>
          <h2 className="ios-title text-2xl font-bold">La librairie Holistique Books</h2>
          <p className="ios-muted mt-2 max-w-2xl text-sm sm:text-base">
            Une collection soignee de livres spirituels et transformationnels, curatee par notre comite editorial.
          </p>
        </div>
        <Link href="/books" className="text-sm font-semibold text-rose-700 hover:text-rose-800">
          Voir toute la collection
        </Link>
      </div>

      {categories.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {categories.map((category) => (
            <span key={category} className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700">
              {category}
            </span>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-4">
          {featured.map((book) => (
            <article key={book.id} className="ios-surface ios-card-hover group overflow-hidden rounded-[2rem]">
              <div className="relative aspect-[3/2] w-full bg-slate-100">
                {book.cover_signed_url ? (
                  <img src={book.cover_signed_url} alt={book.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center p-6 text-center">
                    <div>
                      <BookOpenText className="mx-auto h-8 w-8 text-rose-500" />
                      <p className="mt-3 text-sm font-semibold text-slate-700">{book.title}</p>
                    </div>
                  </div>
                )}
                <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">
                  <Library className="h-4 w-4 text-rose-600" />
                  Vedette
                </div>
              </div>
              <div className="space-y-3 p-5">
                <div>
                  <h3 className="ios-title text-lg font-semibold">{book.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{book.author_name}</p>
                </div>
                <p className="ios-muted line-clamp-3 text-sm leading-6">
                  {book.description?.trim() || book.subtitle?.trim() || "Decouvrez ce livre disponible maintenant dans la librairie."}
                </p>
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-sm font-semibold text-rose-700">{book.price <= 0 ? "Gratuit" : `$${book.price.toFixed(2)}`}</span>
                  <Link href={`/book/${book.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-900 hover:text-rose-700">
                    Voir le livre
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {gridBooks.map((book) => (
            <article key={book.id} className="ios-surface ios-card-hover group overflow-hidden rounded-[1.75rem]">
              <div className="relative h-40 overflow-hidden bg-gradient-to-br from-slate-100 via-white to-rose-50">
                {book.cover_signed_url ? (
                  <img src={book.cover_signed_url} alt={book.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center p-6 text-center">
                    <div>
                      <BookOpenText className="mx-auto h-8 w-8 text-rose-500" />
                      <p className="mt-3 text-sm font-semibold text-slate-700">{book.title}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 p-4">
                <div>
                  <h3 className="ios-title line-clamp-1 text-base font-semibold">{book.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">{book.author_name}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-rose-700">{book.price <= 0 ? "Gratuit" : `$${book.price.toFixed(2)}`}</span>
                  <Link href={`/book/${book.id}`} className="text-xs font-semibold text-slate-700 hover:text-rose-700">
                    Details
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {books.length === 0 ? (
        <div className="ios-surface mt-8 rounded-[1.75rem] border-dashed px-6 py-10 text-center text-sm text-slate-600">
          Aucun livre publie pour le moment.
        </div>
      ) : null}
    </section>
  );
}
