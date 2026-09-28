import { apiServer } from "@/lib/api/server";
import type { ApiBook } from "@/types/api";
import { getPublishedBooks, type PublishedBook } from "@/lib/books";

type ApiAuthor = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  location: string | null;
  professional_headline: string | null;
  genres: string[];
  publishing_goals: string | null;
  favorite_book: string | null;
  favorite_author: string | null;
  favorite_character: string | null;
  press_mentions: unknown[];
  social_links: Record<string, unknown>;
  published_books_count?: number;
  books?: ApiBook[];
};

export type PublicAuthor = ApiAuthor & {
  avatar_signed_url: string | null;
  books: PublishedBook[];
  books_count: number;
  published_books_count: number;
  latest_book: PublishedBook | null;
  top_category: string;
  total_views: number;
  total_purchases: number;
  average_rating: number | null;
};

function pickTopCategory(books: PublishedBook[], authorGenres: string[]) {
  const counts = new Map<string, number>();
  for (const category of books.flatMap((book) => book.categories ?? [])) {
    if (!category) continue;
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? authorGenres[0] ?? "Edition premium";
}

function averageRating(books: PublishedBook[]) {
  const ratings = books.reduce((sum, book) => sum + Number(book.ratings_count ?? 0), 0);
  if (!ratings) return null;
  return Number((books.reduce((sum, book) => sum + Number(book.rating_avg ?? 0) * Number(book.ratings_count ?? 0), 0) / ratings).toFixed(1));
}

export async function getPublicAuthors(): Promise<PublicAuthor[]> {
  try {
    const [{ data: authors }, books] = await Promise.all([
      apiServer<{ data: ApiAuthor[] }>("authors", { authenticated: false }),
      getPublishedBooks(),
    ]);
    return (authors ?? []).map((author) => {
      const authorBooks = books.filter((book) => book.author_id === author.id);
      return {
        ...author,
        avatar_signed_url: author.avatar_url,
        books: authorBooks,
        books_count: authorBooks.length,
        published_books_count: author.published_books_count ?? authorBooks.length,
        latest_book: authorBooks[0] ?? null,
        top_category: pickTopCategory(authorBooks, author.genres ?? []),
        total_views: authorBooks.reduce((sum, book) => sum + Number(book.views_count ?? 0), 0),
        total_purchases: authorBooks.reduce((sum, book) => sum + Number(book.purchases_count ?? 0), 0),
        average_rating: averageRating(authorBooks),
      };
    }).sort((a, b) => b.books_count - a.books_count || a.display_name.localeCompare(b.display_name));
  } catch {
    return [];
  }
}

export async function getPublicAuthorById(authorId: string) {
  try {
    const [{ data: author }, books] = await Promise.all([
      apiServer<{ data: ApiAuthor }>(`authors/${encodeURIComponent(authorId)}`, { authenticated: false }),
      getPublishedBooks(),
    ]);
    const authorBooks = books.filter((book) => book.author_id === author.id);
    return {
      ...author,
      avatar_signed_url: author.avatar_url,
      books: authorBooks,
      books_count: authorBooks.length,
      published_books_count: author.published_books_count ?? authorBooks.length,
      latest_book: authorBooks[0] ?? null,
      top_category: pickTopCategory(authorBooks, author.genres ?? []),
      total_views: authorBooks.reduce((sum, book) => sum + Number(book.views_count ?? 0), 0),
      total_purchases: authorBooks.reduce((sum, book) => sum + Number(book.purchases_count ?? 0), 0),
      average_rating: averageRating(authorBooks),
    } satisfies PublicAuthor;
  } catch {
    return null;
  }
}
