import Link from "next/link";
import { ChevronRight, Search, TrendingUp, Sparkles } from "lucide-react";
import { getPublishedBooks } from "@/lib/books";

export async function HeroSection() {
  const publishedBooks = await getPublishedBooks();
  const trendingBooks = publishedBooks.slice(0, 4);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="ios-surface-strong grid gap-8 rounded-[2.25rem] p-6 lg:grid-cols-[1.5fr_1fr] lg:gap-12 lg:p-8">
        <div className="flex flex-col justify-center">
          <p className="ios-kicker">Bibliotheque africaine</p>
          <h1 className="ios-title text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">Lisez les meilleurs livres africains</h1>
          <p className="ios-muted mt-4 max-w-xl text-lg">
            Decouvrez des ebooks et audiobooks d auteurs africains, en francais et en langues locales.
          </p>

          <form action="/books" method="get" className="mt-6 flex w-full max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="q"
                placeholder="Rechercher un livre, un auteur..."
                className="ios-input w-full rounded-l-2xl py-3 pl-10 pr-4 text-sm"
              />
            </div>
            <button className="ios-button-primary rounded-r-2xl px-5 py-3 text-sm font-semibold">Chercher</button>
          </form>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/books" className="ios-button-primary group flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-all">
              Explorer la librairie
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/dashboard/author/add-book"
              className="ios-button-secondary flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-all"
            >
              Publier votre livre
            </Link>
          </div>

          <p className="ios-muted mt-6 text-sm">
            <Sparkles className="mr-1 inline h-4 w-4 text-rose-500" />
            Livres publies recents et recommandations de lecture.
          </p>
        </div>

        <div className="hidden lg:block">
          <div className="grid grid-cols-2 gap-4">
            {trendingBooks.slice(0, 2).map((book) => {
              const coverUrl = book.cover_signed_url;
              return (
                <Link
                  key={book.id}
                  href={`/book/${book.id}`}
                  className="ios-surface ios-card-hover group relative overflow-hidden rounded-[1.75rem]"
                >
                  <div className="aspect-[2/3] w-full bg-slate-100">
                    {coverUrl ? (
                      <img src={coverUrl} alt={book.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center px-3 text-center text-sm font-semibold text-slate-500">{book.title}</div>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-white">
                    <p className="text-xs font-medium">{book.author_name}</p>
                    <p className="text-sm font-bold">{book.title}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-16">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="ios-title flex items-center gap-2 text-xl font-bold">
            <TrendingUp className="h-5 w-5 text-rose-600" />
            Tendances actuelles
          </h2>
          <Link href="/books" className="text-sm font-medium text-rose-700 hover:underline">
            Voir tout
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
          {trendingBooks.map((book) => {
            const coverUrl = book.cover_signed_url;
            return (
              <Link key={book.id} href={`/book/${book.id}`} className="ios-surface ios-card-hover group rounded-[1.5rem] p-3">
                <div className="aspect-[2/3] w-full overflow-hidden rounded-lg bg-slate-100">
                  {coverUrl ? (
                    <img src={coverUrl} alt={book.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center px-3 text-center text-xs font-semibold text-slate-500">{book.title}</div>
                  )}
                </div>
                <div className="mt-2">
                  <p className="text-xs text-slate-500">{book.author_name}</p>
                  <p className="ios-title line-clamp-1 text-sm font-semibold">{book.title}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs font-medium text-rose-700">{book.price <= 0 ? "Gratuit" : `$${book.price.toFixed(2)}`}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {trendingBooks.length === 0 && <p className="ios-muted text-sm">Aucun livre publie pour le moment.</p>}
      </div>
    </section>
  );
}
