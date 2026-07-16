import Link from "next/link";
import { Flame, Star } from "lucide-react";
import type { PublishedBook } from "@/lib/books";

type TrendingSectionProps = {
  books: PublishedBook[];
};

export function TrendingSection({ books }: TrendingSectionProps) {
  const trending = books.slice(0, 8);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="ios-kicker">Tendances</p>
          <h2 className="ios-title text-2xl font-bold">Les livres qui se vendent maintenant</h2>
          <p className="ios-muted mt-2 max-w-2xl text-sm sm:text-base">
            Choisis par les lecteurs, recommandes par notre equipe.
          </p>
        </div>
        <Link href="/books" className="text-sm font-semibold text-rose-700 hover:text-rose-800">
          Voir tout
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {trending.map((book, index) => (
          <article key={book.id} className="ios-surface ios-card-hover rounded-[1.5rem] p-3">
            <div className="relative">
              <div className="hb-shimmer aspect-[2/3] w-full overflow-hidden rounded-xl bg-slate-100 shadow-2xl">
                {book.cover_signed_url ? (
                  <img src={book.cover_signed_url} alt={book.title} className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center px-3 text-center text-xs font-semibold text-slate-500">{book.title}</div>
                )}
              </div>
              <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-700">
                <Flame className="h-3 w-3 text-rose-600" />
                # {index + 1}
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <div>
                <p className="text-xs text-slate-500">{book.author_name}</p>
                <p className="ios-title line-clamp-1 text-sm font-semibold">{book.title}</p>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-semibold text-rose-700">{book.price <= 0 ? "Gratuit" : `$${book.price.toFixed(2)}`}</span>
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3 w-3 text-amber-500" />
                  4.{(index % 4) + 4}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Link href={`/book/${book.id}`} className="text-xs font-semibold text-slate-700 hover:text-rose-700">
                  Voir le livre
                </Link>
                <Link
                  href={`/book/${book.id}`}
                  className="group relative text-xs font-semibold text-rose-700"
                >
                  Lire un extrait
                  <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-52 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-[10px] text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                    Pas besoin de carte bancaire pour lire les 10 premieres pages.
                  </span>
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5 text-xs text-slate-500">
        Paiement securise par Mobile Money (Orange, Airtel, M-Pesa). Testez avant d acheter: extrait gratuit.
      </div>

      {trending.length === 0 && <p className="ios-muted mt-6 text-sm">Aucun livre publie pour le moment.</p>}
    </section>
  );
}
