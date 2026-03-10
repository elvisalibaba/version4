import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { PublishedBook } from "@/lib/books";

type FeaturedAuthorsSectionProps = {
  books: PublishedBook[];
};

export function FeaturedAuthorsSection({ books }: FeaturedAuthorsSectionProps) {
  const authorMap = new Map<string, { name: string; count: number; categories: string[] }>();

  for (const book of books) {
    const name = book.author_name?.trim();
    if (!name || name.toLowerCase() === "auteur inconnu") continue;
    const entry = authorMap.get(book.author_id) ?? { name, count: 0, categories: [] };
    entry.count += 1;
    entry.categories.push(...(book.categories ?? []));
    authorMap.set(book.author_id, entry);
  }

  const authors = Array.from(authorMap.values())
    .map((author) => {
      const categoryCounts = new Map<string, number>();
      for (const category of author.categories) {
        if (!category) continue;
        categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
      }
      const topCategory =
        [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Edition spirituelle";
      return { ...author, topCategory };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const fallbackAuthors = [
    { name: "Collectif Holistique", topCategory: "Spiritualite", count: 4 },
    { name: "Amina Koffi", topCategory: "Leadership", count: 3 },
    { name: "Chinedu Obi", topCategory: "Roman social", count: 2 },
  ];

  const finalAuthors = authors.length > 0 ? authors : fallbackAuthors;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="ios-kicker">Auteurs disponibles</p>
          <h2 className="ios-title text-2xl font-bold">Des voix spirituelles accompagnees par notre maison</h2>
          <p className="ios-muted mt-2 max-w-2xl text-sm sm:text-base">
            Selectionnez un auteur, decouvrez ses titres et suivez son parcours editorial.
          </p>
        </div>
        <Link href="/books" className="text-sm font-semibold text-rose-700 hover:text-rose-800">
          Explorer les auteurs
        </Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3 lg:grid-cols-3">
        {finalAuthors.map((author) => {
          const initials = author.name
            .split(" ")
            .map((part) => part[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();

          return (
            <article key={author.name} className="ios-surface ios-card-hover rounded-[1.75rem] p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-slate-200 text-lg font-semibold text-rose-700">
                  {initials}
                </div>
                <div>
                  <h3 className="ios-title font-semibold">{author.name}</h3>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{author.topCategory}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                <span>{author.count} titres disponibles</span>
                <span className="inline-flex items-center gap-1 text-rose-700">
                  Profil
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
