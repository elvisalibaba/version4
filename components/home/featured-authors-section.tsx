import Link from "next/link";
import type { PublishedBook } from "@/lib/books";

type FeaturedAuthorsSectionProps = {
  books: PublishedBook[];
};

export function FeaturedAuthorsSection({ books }: FeaturedAuthorsSectionProps) {
  const authorMap = new Map<string, { name: string; count: number; categories: string[]; avatar_url: string | null }>();

  for (const book of books) {
    const name = book.author_name?.trim();
    if (!name || name.toLowerCase() === "auteur inconnu") continue;
    const entry = authorMap.get(book.author_id) ?? {
      name,
      count: 0,
      categories: [],
      avatar_url: book.author_avatar_url ?? null,
    };
    entry.count += 1;
    entry.categories.push(...(book.categories ?? []));
    if (!entry.avatar_url && book.author_avatar_url) {
      entry.avatar_url = book.author_avatar_url;
    }
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
    { name: "Collectif Holistique", topCategory: "Spiritualite", count: 4, avatar_url: null },
    { name: "Amina Koffi", topCategory: "Leadership", count: 3, avatar_url: null },
    { name: "Chinedu Obi", topCategory: "Roman social", count: 2, avatar_url: null },
  ];

  const finalAuthors = authors.length > 0 ? authors : fallbackAuthors;

  return (
    <section className="hb-section">
      <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-4 sm:px-6">
        <div>
          <p className="hb-kicker">Voix a suivre</p>
          <h2 className="hb-title text-2xl sm:text-3xl">Des auteurs qui ecrivent pour faire grandir.</h2>
          <p className="hb-muted mt-2 max-w-2xl text-sm sm:text-base">
            Leadership, spiritualite, guerison interieure, discipline, vision: decouvrez les voix qui donnent du relief a notre catalogue.
          </p>
        </div>
        <Link href="/books" className="hb-link text-sm font-semibold">
          Decouvrir les auteurs
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
          const avatarUrl = author.avatar_url?.trim();

          return (
            <article key={author.name} className="hb-author-card">
              <div className="hb-author-avatar">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={author.name} className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
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
