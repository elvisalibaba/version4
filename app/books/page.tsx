import { BookCard } from "@/components/books/book-card";
import { HEADER_CATEGORY_ITEMS, isBookCategory, isHeaderCategoryValue } from "@/lib/book-categories";
import { getPublishedBooks } from "@/lib/books";
import Link from "next/link";

type BooksPageProps = {
  searchParams: Promise<{ q?: string; category?: string }>;
};

export default async function BooksPage({ searchParams }: BooksPageProps) {
  const { q, category } = await searchParams;
  const searchQuery = q?.trim() ?? "";
  const normalizedCategory = isHeaderCategoryValue(category) ? category : undefined;
  const books = await getPublishedBooks({
    searchQuery,
    category: isBookCategory(normalizedCategory) ? normalizedCategory : undefined,
  });
  const activeCategoryLabel = HEADER_CATEGORY_ITEMS.find((item) => item.value === normalizedCategory)?.label;

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="ios-kicker">Catalogue</p>
        <h1 className="ios-title text-3xl font-bold">Books</h1>
      </div>
      {(searchQuery || activeCategoryLabel) && (
        <div className="ios-surface flex flex-wrap items-center gap-3 rounded-[1.5rem] px-4 py-3">
          {activeCategoryLabel ? (
            <p className="text-sm text-slate-700">
              Categorie: <span className="font-semibold">{activeCategoryLabel}</span>
            </p>
          ) : null}
          {searchQuery ? (
            <p className="text-sm text-slate-700">
              Resultats pour: <span className="font-semibold">&quot;{searchQuery}&quot;</span>
            </p>
          ) : null}
          <Link href="/books" className="text-sm font-medium text-rose-700 hover:text-rose-800">
            Effacer
          </Link>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {books.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
      {books.length === 0 && (
        <p className="ios-muted">
          {searchQuery || activeCategoryLabel ? "Aucun livre trouve pour ce filtre." : "No published books yet."}
        </p>
      )}
    </section>
  );
}
