import Link from "next/link";
import { ArrowUpRight, BookOpen, Sparkles } from "lucide-react";
import type { PublishedBook } from "@/lib/books";

type HeroSectionProps = {
  books: PublishedBook[];
};

export function HeroSection({ books }: HeroSectionProps) {
  const spotlight = books[0];
  const latest = books.slice(0, 5);
  const authorCount = new Set(books.map((book) => book.author_id)).size;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-16">
      <div className="ios-surface-strong relative overflow-hidden rounded-[2.75rem] p-6 sm:p-10">
        <div className="absolute -right-16 top-10 h-56 w-56 rounded-full bg-rose-200/35 blur-3xl" />
        <div className="absolute -bottom-16 left-10 h-64 w-64 rounded-full bg-slate-200/40 blur-3xl" />

        <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="ios-kicker">Edition premium & diffusion internationale</p>
              <h1 className="ios-title text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
                Publier un livre, votre reve, notre metier.
              </h1>
              <p className="ios-muted max-w-xl text-base leading-relaxed sm:text-lg">
                Faites emerger votre voix avec un accompagnement editorial, une distribution large et des outils modernes pour
                vendre vos livres partout.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/services" className="ios-button-primary flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold">
                Decouvrir nos services
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link href="/librairie" className="ios-button-secondary flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold">
                Explorer la librairie
                <BookOpen className="h-4 w-4" />
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-rose-600" />
                <span>
                  <strong className="text-slate-900">{books.length}</strong> livres publies
                </span>
              </div>
              <div>
                <strong className="text-slate-900">{authorCount}</strong> auteurs accompagnes
              </div>
              <div className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700">
                Distribution 200 librairies en ligne
              </div>
            </div>

            <p className="ios-muted text-sm">
              <Sparkles className="mr-1 inline h-4 w-4 text-rose-500" />
              Des solutions sur-mesure pour publier, vendre et faire rayonner votre oeuvre.
            </p>
          </div>

          <div className="space-y-6">
            <div className="ios-surface rounded-[2rem] p-4 sm:p-5">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>Dernieres parutions</span>
                <span>{latest.length} titres</span>
              </div>
              <div className="hb-marquee mt-4">
                <div className="hb-marquee-track">
                  {[...latest, ...latest].map((book, index) => (
                    <div key={`${book.id}-${index}`} className="hb-marquee-item">
                      <div className="aspect-[2/3] w-24 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm">
                        {book.cover_signed_url ? (
                          <img
                            src={book.cover_signed_url}
                            alt={book.title}
                            className="h-full w-full object-cover"
                            loading={index < latest.length ? "eager" : "lazy"}
                            decoding="async"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center px-2 text-center text-[10px] font-semibold text-slate-500">
                            {book.title}
                          </div>
                        )}
                      </div>
                      <p className="mt-2 max-w-[96px] truncate text-xs font-semibold text-slate-700">{book.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-sm">
              <div className="absolute -right-6 -top-5 rotate-6 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-lg">
                Collection phare
              </div>
              <div className="relative rounded-[2.5rem] border border-white/40 bg-white/70 p-3 shadow-2xl backdrop-blur">
                <div className="hb-shimmer aspect-[4/5] w-full overflow-hidden rounded-[2rem] bg-slate-100">
                  {spotlight?.cover_signed_url ? (
                    <img
                      src={spotlight.cover_signed_url}
                      alt={spotlight.title}
                      className="h-full w-full object-cover"
                      loading="eager"
                      decoding="async"
                      fetchPriority="high"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-6 text-center text-sm font-semibold text-slate-500">
                      Votre prochain bestseller
                    </div>
                  )}
                </div>
                <div className="mt-4 space-y-1 text-center">
                  <p className="text-xs uppercase tracking-wide text-rose-600">Edition premium</p>
                  <p className="text-base font-semibold text-slate-900">{spotlight?.title ?? "Manuscrit en lumiere"}</p>
                  <p className="text-xs text-slate-500">{spotlight?.author_name ?? "Auteur accompagne"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
