import { createClient } from "@/lib/supabase/server";
import { isBookCategory } from "@/lib/book-categories";
import type { BookFormatType, Database } from "@/types/database";

type PublishedBookRow = Pick<
  Database["public"]["Tables"]["books"]["Row"],
  | "id"
  | "title"
  | "subtitle"
  | "description"
  | "price"
  | "cover_url"
  | "status"
  | "author_id"
  | "created_at"
  | "published_at"
  | "categories"
> & {
  author: { name: string | null }[] | { name: string | null } | null;
  book_formats: { format: BookFormatType; price: number; is_published: boolean }[] | null;
};

type BookDetailRow = Pick<
  Database["public"]["Tables"]["books"]["Row"],
  | "id"
  | "title"
  | "subtitle"
  | "description"
  | "price"
  | "cover_url"
  | "status"
  | "author_id"
  | "file_url"
  | "language"
  | "publisher"
  | "publication_date"
  | "page_count"
  | "categories"
  | "tags"
  | "age_rating"
> & {
  author: { name: string | null }[] | { name: string | null } | null;
  book_formats: { id: string; format: BookFormatType; price: number; file_url: string | null; downloadable: boolean; is_published: boolean }[] | null;
};

type GetPublishedBooksOptions = {
  searchQuery?: string;
  category?: string;
};

export async function getPublishedBooks(options: GetPublishedBooksOptions = {}) {
  const supabase = await createClient();
  const { searchQuery, category } = options;

  let query = supabase
    .from("books")
    .select(
      "id, title, subtitle, description, price, cover_url, status, author_id, created_at, published_at, categories, author:profiles!books_author_id_fkey(name), book_formats!left(format, price, is_published)",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (isBookCategory(category)) {
    query = query.contains("categories", [category]);
  }

  const term = searchQuery?.trim();
  if (term) {
    const safeTerm = term.replace(/[%_,]/g, " ");
    query = query.or(`title.ilike.%${safeTerm}%,subtitle.ilike.%${safeTerm}%`);
  }

  const { data, error } = await query.returns<PublishedBookRow[]>();

  if (error) {
    return [];
  }

  const books = (data ?? []) as PublishedBookRow[];
  const coverPaths = books
    .map((book) => book.cover_url)
    .filter((path): path is string => typeof path === "string" && path.length > 0 && !path.startsWith("http://") && !path.startsWith("https://"));

  const signedCoverByPath = new Map<string, string>();
  await Promise.all(
    coverPaths.map(async (path) => {
      const { data: signed } = await supabase.storage.from("books").createSignedUrl(path, 60 * 60);
      if (signed?.signedUrl) signedCoverByPath.set(path, signed.signedUrl);
    }),
  );

  return books.map((book) => {
    const ebook = (book.book_formats ?? []).find((fmt) => fmt.format === "ebook" && fmt.is_published);
    const author = Array.isArray(book.author) ? book.author[0] : book.author;
    return {
      ...book,
      author_name: author?.name ?? "Auteur inconnu",
      cover_signed_url:
        (book.cover_url && (book.cover_url.startsWith("http://") || book.cover_url.startsWith("https://")) ? book.cover_url : null) ??
        (book.cover_url ? signedCoverByPath.get(book.cover_url) ?? null : null),
      price: ebook?.price ?? book.price,
    };
  });
}

export async function getBookById(bookId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("books")
    .select(
      "id, title, subtitle, description, price, cover_url, status, author_id, file_url, language, publisher, publication_date, page_count, categories, tags, age_rating, author:profiles!books_author_id_fkey(name), book_formats!left(id, format, price, file_url, downloadable, is_published)",
    )
    .eq("id", bookId)
    .returns<BookDetailRow>()
    .single();

  const book = data as BookDetailRow | null;
  if (!book) return null;

  const ebook = (book.book_formats ?? []).find((fmt) => fmt.format === "ebook" && fmt.is_published);
  const author = Array.isArray(book.author) ? book.author[0] : book.author;
  const shouldSignCover = book.cover_url && !book.cover_url.startsWith("http://") && !book.cover_url.startsWith("https://");
  const { data: signedCover } =
    shouldSignCover && book.cover_url
      ? await supabase.storage.from("books").createSignedUrl(book.cover_url, 60 * 60)
      : { data: null };

  return {
    ...book,
    author_name: author?.name ?? "Auteur inconnu",
    cover_signed_url:
      (book.cover_url && (book.cover_url.startsWith("http://") || book.cover_url.startsWith("https://")) ? book.cover_url : null) ??
      signedCover?.signedUrl ??
      null,
    price: ebook?.price ?? book.price,
    file_url: ebook?.file_url ?? book.file_url,
  };
}

export type PublishedBook = Awaited<ReturnType<typeof getPublishedBooks>>[number];
