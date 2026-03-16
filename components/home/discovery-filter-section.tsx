import { Search } from "lucide-react";
import type { PublishedBook } from "@/lib/books";

type DiscoveryFilterSectionProps = {
  books: PublishedBook[];
};

function buildCategoryOptions(books: PublishedBook[]) {
  const counts = new Map<string, number>();

  for (const book of books) {
    for (const category of book.categories ?? []) {
      if (!category) continue;
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
  }

  return [...counts.keys()].sort((a, b) => a.localeCompare(b)).slice(0, 12);
}

function buildAuthorOptions(books: PublishedBook[]) {
  const counts = new Map<string, number>();

  for (const book of books) {
    const name = book.author_name?.trim();
    if (!name || name.toLowerCase() === "auteur inconnu") continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  return [...counts.keys()].sort((a, b) => a.localeCompare(b)).slice(0, 12);
}

export function DiscoveryFilterSection({ books }: DiscoveryFilterSectionProps) {
  const categories = buildCategoryOptions(books);
  const authors = buildAuthorOptions(books);

  return (
    <section id="explorer" className="hb-section hb-template-filter-section">
      <div className="hb-section-shell">
        <form action="/books" className="hb-template-filter-bar">
          <label className="hb-template-filter-field">
            <select name="category" defaultValue="all">
              <option value="all">All Category</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="hb-template-filter-field">
            <select name="author" defaultValue="">
              <option value="">All Author</option>
              {authors.map((author) => (
                <option key={author} value={author}>
                  {author}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" className="hb-template-find-button">
            <Search className="h-4 w-4" />
            Find Book
          </button>
        </form>
      </div>
    </section>
  );
}
