import Link from "next/link";
import { ArrowUpRight, BookOpen, ChevronRight, Search, Sparkles, TrendingUp } from "lucide-react";
import type { PublishedBook } from "@/lib/books";

type HeroSectionProps = {
  books: PublishedBook[];
};

export function HeroSection({ books }: HeroSectionProps) {
  const trendingBooks = books.slice(0, 6);
  const spotlight = trendingBooks[0];
  const authorCount = new Set(books.map((book) => book.author_id)).size;
  const categoryCount = new Set(books.flatMap((book) => book.categories ?? [])).size;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="ios-surface-strong relative overflow-hidden rounded-[2.5rem] p-6 sm:p-8">
        <div className="absolute -right-12 top-8 h-48 w-48 rounded-full bg-rose-200/30 blur-3xl" />
        <div className="absolute -bottom-12 left-12 h-56 w-56 rounded-full bg-slate-200/40 blur-3xl" />

        <div className="relative grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:items-center">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="ios-kicker">Maison d edition spirituelle & transformationnelle</p>
              <h1 className="ios-title text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
                L experience editoriale premium qui eleve les voix spirituelles africaines.
              </h1>
              <p className="ios-muted max-w-xl text-base leading-relaxed sm:text-lg">
                Nous accompagnons les auteurs, produisons des editions soignees et diffusons des livres qui nourrissent la foi,
                la sagesse et la transformation personnelle.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/books" className="ios-button-primary group flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold">
                Explorer la bibliotheque
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/home#contact" className="ios-button-secondary flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold">
                Parler a un editeur
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <form action="/books" method="get" className="flex w-full max-w-xl overflow-hidden rounded-2xl bg-white/80 shadow-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="q"
                  placeholder="Rechercher un livre, un auteur, une thematique..."
                  className="ios-input w-full border-0 bg-transparent py-3 pl-10 pr-4 text-sm"
                />
              </div>
              <button className="ios-button-primary rounded-none px-5 text-sm font-semibold">Chercher</button>
            </form>

            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-rose-600" />
                <span>
                  <strong className="text-slate-900">{books.length}</strong> titres disponibles
                </span>
              </div>
              <div>
                <strong className="text-slate-900">{authorCount}</strong> auteurs accompagnes
              </div>
              <div>
                <strong className="text-slate-900">{categoryCount}</strong> thematiques actives
              </div>
            </div>

            <p className="ios-muted text-sm">
              <Sparkles className="mr-1 inline h-4 w-4 text-rose-500" />
              Selection editoriale, edition premium, diffusion internationale et publicite digitale.
            </p>
          </div>

          <div className="space-y-6">
            <div className="ios-surface ios-card-hover relative overflow-hidden rounded-[2rem]">
              <div className="absolute right-4 top-4 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700">
                Livre a la une
              </div>
              <div className="aspect-[3/4] w-full bg-slate-100">
                {spotlight?.cover_signed_url ? (
                  <img src={spotlight.cover_signed_url} alt={spotlight.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center px-5 text-center text-sm font-semibold text-slate-500">
                    {spotlight?.title ?? "Nouvelle parution"}
                  </div>
                )}
              </div>
              <div className="border-t border-white/40 bg-white/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selection editoriale</p>
                <p className="ios-title mt-1 text-lg font-semibold">{spotlight?.title ?? "Votre prochain bestseller"}</p>
                <p className="text-sm text-slate-600">{spotlight?.author_name ?? "Auteur a decouvrir"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {trendingBooks.slice(1, 4).map((book) => (
                <Link key={book.id} href={`/book/${book.id}`} className="ios-surface ios-card-hover overflow-hidden rounded-2xl">
                  <div className="aspect-[2/3] w-full bg-slate-100">
                    {book.cover_signed_url ? (
                      <img src={book.cover_signed_url} alt={book.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center px-2 text-center text-xs font-semibold text-slate-500">{book.title}</div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="ios-title flex items-center gap-2 text-xl font-bold">
            <TrendingUp className="h-5 w-5 text-rose-600" />
            Tendances actuelles
          </h2>
          <Link href="/books" className="text-sm font-semibold text-rose-700 hover:underline">
            Voir toute la bibliotheque
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {trendingBooks.map((book) => (
            <Link key={book.id} href={`/book/${book.id}`} className="ios-surface ios-card-hover group rounded-[1.5rem] p-3">
              <div className="aspect-[2/3] w-full overflow-hidden rounded-lg bg-slate-100">
                {book.cover_signed_url ? (
                  <img src={book.cover_signed_url} alt={book.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
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
          ))}
        </div>

        {trendingBooks.length === 0 && <p className="ios-muted text-sm">Aucun livre publie pour le moment.</p>}
      </div>
    </section>
  );
}
