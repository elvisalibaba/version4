import Link from "next/link";
import { ArrowRight, BookOpenText } from "lucide-react";
import { getPublishedBooks } from "@/lib/books";

export async function LibraryExtractsSection() {
  const books = (await getPublishedBooks()).slice(0, 4);
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="ios-kicker">Selection reelle</p>
          <h2 className="ios-title text-2xl font-bold">Extraits de la librairie</h2>
        </div>
        <Link href="/books" className="text-sm font-semibold text-rose-700 hover:text-rose-800">
          Voir toute la collection
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {books.map((book, index) => (
          <article
            key={book.id}
            className="ios-surface ios-card-hover group overflow-hidden rounded-[1.75rem]"
          >
            <div className="relative h-44 overflow-hidden bg-gradient-to-br from-slate-100 via-white to-rose-50">
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
              <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                Extrait {index + 1}
              </div>
            </div>

            <div className="space-y-3 p-4">
              <div>
                <h3 className="ios-title line-clamp-1 text-base font-semibold">{book.title}</h3>
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

      {books.length === 0 ? (
        <div className="ios-surface rounded-[1.75rem] border-dashed px-6 py-10 text-center text-sm text-slate-600">
          Aucun livre publie pour le moment.
        </div>
      ) : null}
    </section>
  );
}
