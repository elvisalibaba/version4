import { BookCard } from "@/components/books/book-card";
import type { PublishedBook } from "@/lib/books";

type FeaturedBooksGridSectionProps = {
  id?: string;
  title: string;
  books: PublishedBook[];
};

export function FeaturedBooksGridSection({ id, title, books }: FeaturedBooksGridSectionProps) {
  if (books.length === 0) return null;

  return (
    <section id={id} className="hb-section hb-template-popular-section">
      <div className="hb-section-shell">
        <div className="hb-template-popular-header">
          <h2 className="hb-template-popular-title">{title}</h2>
          <span className="hb-template-popular-line" aria-hidden="true" />
        </div>

        <div className="hb-template-popular-grid">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </div>
    </section>
  );
}
