import Link from "next/link";
import { ArrowUpRight, BookOpen, ChevronRight, Search, Sparkles } from "lucide-react";
import type { PublishedBook } from "@/lib/books";

type HeroSectionProps = {
  books: PublishedBook[];
};

export function HeroSection({ books }: HeroSectionProps) {
  const spotlight = books[0];
  const authorCount = new Set(books.map((book) => book.author_id)).size;
  const categoryCount = new Set(books.flatMap((book) => book.categories ?? [])).size;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-16">
      <div className="ios-surface-strong relative overflow-hidden rounded-[2.75rem] p-6 sm:p-10">
        <div className="absolute -right-12 top-8 h-48 w-48 rounded-full bg-rose-200/30 blur-3xl" />
        <div className="absolute -bottom-12 left-12 h-56 w-56 rounded-full bg-slate-200/40 blur-3xl" />

        <div className="relative grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="ios-kicker">Maison d edition premium & transformationnelle</p>
              <h1 className="ios-title text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
                La plus grande bibliotheque africaine, dans votre poche.
              </h1>
              <p className="ios-muted max-w-xl text-base leading-relaxed sm:text-lg">
                Accedez instantanement a des milliers d ebooks et audiobooks d auteurs locaux.
                Commencez a lire gratuitement, sans engagement.
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

            <div className="flex flex-wrap gap-2 text-xs text-slate-600">
              {["Amazon Kindle", "Kobo", "Google Play Books", "Apple Books"].map((label) => (
                <span key={label} className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 font-semibold text-slate-700">
                  {label}
                </span>
              ))}
            </div>

            <p className="ios-muted text-sm">
              <Sparkles className="mr-1 inline h-4 w-4 text-rose-500" />
              Selection editoriale, edition premium, diffusion internationale et publicite digitale.
            </p>
          </div>

          <div className="space-y-6">
            <div className="relative mx-auto w-full max-w-sm">
              <div className="absolute -right-8 -top-6 rotate-6 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-lg">
                Disponible sur Amazon
              </div>
              <div className="relative -rotate-2 rounded-[2.75rem] border border-white/30 bg-slate-950/95 p-3 shadow-2xl">
                <div className="relative overflow-hidden rounded-[2.2rem] bg-slate-100">
                  <div className="hb-shimmer aspect-[9/16] w-full bg-slate-100">
                    {spotlight?.cover_signed_url ? (
                      <img src={spotlight.cover_signed_url} alt={spotlight.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center px-6 text-center text-sm font-semibold text-slate-500">
                        {spotlight?.title ?? "Lecture immersive"}
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
                    <p className="text-xs uppercase tracking-wide text-white/70">Lecture fluide</p>
                    <p className="text-base font-semibold">{spotlight?.title ?? "Votre prochain bestseller"}</p>
                    <p className="text-xs text-white/80">{spotlight?.author_name ?? "Auteur local"}</p>
                  </div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center text-xs text-slate-600">
                <div className="rounded-2xl border border-slate-200 bg-white/70 px-2 py-3">
                  Lecture hors-ligne
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/70 px-2 py-3">
                  Mobile Money
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/70 px-2 py-3">
                  Support 24/7
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
