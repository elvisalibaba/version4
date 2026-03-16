import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { PublishedBook } from "@/lib/books";

type AuthorTrustSectionProps = {
  books: PublishedBook[];
};

export function AuthorTrustSection({ books }: AuthorTrustSectionProps) {
  const showcase = books.slice(0, 20);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="ios-kicker">Confiance des auteurs</p>
          <h2 className="ios-title text-3xl font-bold sm:text-4xl">Plus de 100 auteurs ont choisi Holistique Books.</h2>
          <p className="ios-muted max-w-2xl text-sm sm:text-base">
            Decouvrez une selection de livres publies recemment. Des couvertures fortes, une qualite d&apos;edition exigeante et une
            mise en avant digne des meilleures plateformes.
          </p>
        </div>
        <Link href="/librairie" className="ios-button-secondary flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold">
          Voir toute la librairie
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {showcase.map((book) => (
          <Link key={book.id} href={`/book/${book.id}`} className="ios-surface ios-card-hover rounded-3xl p-4">
            <div className="aspect-[2/3] overflow-hidden rounded-2xl bg-slate-100">
              {book.cover_signed_url ? (
                <img
                  src={book.cover_signed_url}
                  alt={book.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-4 text-center text-sm font-semibold text-slate-500">
                  {book.title}
                </div>
              )}
            </div>
            <div className="mt-3 space-y-1">
              <p className="text-sm font-semibold text-slate-900">{book.title}</p>
              <p className="text-xs text-slate-500">{book.author_name ?? "Auteur accompagne"}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
