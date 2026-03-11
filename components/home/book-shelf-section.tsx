import Link from "next/link";
import type { PublishedBook } from "@/lib/books";

type BookShelfSectionProps = {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  books: PublishedBook[];
};

export function BookShelfSection({ title, subtitle, ctaLabel = "Voir tout", ctaHref = "/librairie", books }: BookShelfSectionProps) {
  if (books.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <p className="ios-kicker">{title}</p>
          {subtitle ? <h2 className="ios-title text-2xl font-bold sm:text-3xl">{subtitle}</h2> : null}
        </div>
        <Link href={ctaHref} className="text-sm font-semibold text-rose-700 hover:text-rose-600">
          {ctaLabel}
        </Link>
      </div>

      <div className="mt-5 flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:overflow-visible lg:grid-cols-6">
        {books.map((book) => (
          <Link
            key={book.id}
            href={`/book/${book.id}`}
            className="ios-surface ios-card-hover min-w-[140px] rounded-2xl p-3 md:min-w-0"
          >
            <div className="aspect-[2/3] overflow-hidden rounded-xl bg-slate-100">
              {book.cover_signed_url ? (
                <img src={book.cover_signed_url} alt={book.title} className="h-full w-full object-cover" loading="lazy" decoding="async" />
              ) : (
                <div className="flex h-full items-center justify-center px-2 text-center text-xs font-semibold text-slate-500">
                  {book.title}
                </div>
              )}
            </div>
            <p className="mt-2 truncate text-xs font-semibold text-slate-700">{book.title}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
