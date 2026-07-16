import { getPublishedBooks, type PublishedBook } from "@/lib/books";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type AuthorProfileRow = Pick<
  Database["public"]["Tables"]["author_profiles"]["Row"],
  | "id"
  | "display_name"
  | "avatar_url"
  | "bio"
  | "website"
  | "location"
  | "professional_headline"
  | "genres"
  | "publishing_goals"
  | "created_at"
  | "updated_at"
>;

export type PublicAuthor = AuthorProfileRow & {
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

function isNextDynamicServerUsageError(error: unknown) {
  return typeof error === "object" && error !== null && "digest" in error && (error as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE";
}

function isRemoteUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://");
}

function pickTopCategory(books: PublishedBook[], authorGenres: string[]) {
  const counts = new Map<string, number>();

  for (const category of books.flatMap((book) => book.categories ?? [])) {
    if (!category) continue;
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }

  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? authorGenres[0] ?? "Edition premium";
}

function computeAverageRating(books: PublishedBook[]) {
  const totalRatings = books.reduce((total, book) => total + Number(book.ratings_count ?? 0), 0);
  if (totalRatings <= 0) return null;

  const weighted = books.reduce((total, book) => total + Number(book.rating_avg ?? 0) * Number(book.ratings_count ?? 0), 0);
  return Number((weighted / totalRatings).toFixed(1));
}

async function resolveAvatarUrl(supabase: Awaited<ReturnType<typeof createClient>>, avatarUrl: string | null) {
  const cleanAvatarUrl = avatarUrl?.trim();
  if (!cleanAvatarUrl) return null;
  if (isRemoteUrl(cleanAvatarUrl)) return cleanAvatarUrl;

  const { data } = await supabase.storage.from("books").createSignedUrl(cleanAvatarUrl, 60 * 60);
  return data?.signedUrl ?? null;
}

export async function getPublicAuthors() {
  try {
    const supabase = await createClient();
    const [{ data, error }, publishedBooks] = await Promise.all([
      supabase
        .from("author_profiles")
        .select("id, display_name, avatar_url, bio, website, location, professional_headline, genres, publishing_goals, created_at, updated_at")
        .order("display_name", { ascending: true })
        .returns<AuthorProfileRow[]>(),
      getPublishedBooks(),
    ]);

    if (error) {
      console.warn("[Authors] Unable to fetch public author profiles.", error.message);
      return [];
    }

    const booksByAuthorId = new Map<string, PublishedBook[]>();
    for (const book of publishedBooks) {
      const authorBooks = booksByAuthorId.get(book.author_id) ?? [];
      authorBooks.push(book);
      booksByAuthorId.set(book.author_id, authorBooks);
    }

    const authors = await Promise.all(
      (data ?? []).map(async (author) => {
        const books = [...(booksByAuthorId.get(author.id) ?? [])].sort((left, right) => {
          const leftTime = new Date(left.published_at ?? left.created_at).getTime();
          const rightTime = new Date(right.published_at ?? right.created_at).getTime();
          return rightTime - leftTime;
        });

        return {
          ...author,
          avatar_signed_url: await resolveAvatarUrl(supabase, author.avatar_url),
          books,
          books_count: books.length,
          published_books_count: books.length,
          latest_book: books[0] ?? null,
          top_category: pickTopCategory(books, author.genres ?? []),
          total_views: books.reduce((total, book) => total + Number(book.views_count ?? 0), 0),
          total_purchases: books.reduce((total, book) => total + Number(book.purchases_count ?? 0), 0),
          average_rating: computeAverageRating(books),
        } satisfies PublicAuthor;
      }),
    );

    return authors.sort((left, right) => right.books_count - left.books_count || left.display_name.localeCompare(right.display_name));
  } catch (error) {
    if (isNextDynamicServerUsageError(error)) {
      throw error;
    }
    console.error("[Authors] Failed to fetch public authors. Returning empty list.", error);
    return [];
  }
}

export async function getPublicAuthorById(authorId: string) {
  const authors = await getPublicAuthors();
  return authors.find((author) => author.id === authorId) ?? null;
}
