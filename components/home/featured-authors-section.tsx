import Link from "next/link";
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
        [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Edition premium";
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
    <section className="hb-section">
      <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-4 sm:px-6">
        <div>
          <p className="hb-kicker">Auteurs favoris</p>
          <h2 className="hb-title text-2xl sm:text-3xl">Des voix que nos lecteurs suivent toute l&apos;annee.</h2>
          <p className="hb-muted mt-2 max-w-2xl text-sm sm:text-base">
            Explorez les auteurs, leurs univers et les categories qu&apos;ils dominent.
          </p>
        </div>
        <Link href="/books" className="hb-link text-sm font-semibold">
          Voir tous les auteurs
        </Link>
      </div>

      <div className="mx-auto mt-6 flex max-w-7xl gap-4 overflow-x-auto px-4 pb-2 sm:px-6">
        {finalAuthors.map((author) => {
          const initials = author.name
            .split(" ")
            .map((part) => part[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();

          return (
            <article key={author.name} className="hb-author-card">
              <div className="hb-author-avatar">{initials}</div>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">{author.name}</h3>
              <p className="text-xs text-slate-500">{author.topCategory}</p>
              <span className="mt-3 hb-pill">{author.count} titres</span>
            </article>
          );
        })}
      </div>
    </section>
  );
}
