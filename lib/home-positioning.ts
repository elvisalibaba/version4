import "server-only";

import type { PublishedBook } from "@/lib/books";
import { apiServer } from "@/lib/api/server";

const HOME_FEATURED_PREVIEW_LIMIT = 6;

export type HomeFeaturedConfig = {
  selectedBookIds: string[];
  updatedAt: string;
};

export async function getHomeFeaturedConfig(): Promise<HomeFeaturedConfig> {
  try {
    const response = await apiServer<{ selected_book_ids: string[] }>("home/featured", { authenticated: false });
    return { selectedBookIds: response.selected_book_ids ?? [], updatedAt: new Date().toISOString() };
  } catch {
    return { selectedBookIds: [], updatedAt: new Date().toISOString() };
  }
}

export async function saveHomeFeaturedConfig(_config: HomeFeaturedConfig) {
  throw new Error("La mise en avant de l’accueil se gère désormais dans Laravel.");
}
export async function addBookToHomeFeatured(_bookId: string) { return saveHomeFeaturedConfig(await getHomeFeaturedConfig()); }
export async function removeBookFromHomeFeatured(_bookId: string) { return saveHomeFeaturedConfig(await getHomeFeaturedConfig()); }
export async function clearHomeFeaturedBooks() { return saveHomeFeaturedConfig(await getHomeFeaturedConfig()); }
export async function moveHomeFeaturedBook(_bookId: string, _direction: "up" | "down") { return saveHomeFeaturedConfig(await getHomeFeaturedConfig()); }

export async function getHomeFeaturedState(books: PublishedBook[]) {
  const config = await getHomeFeaturedConfig();
  const byId = new Map(books.map((book) => [book.id, book]));
  const selectedBooks = config.selectedBookIds.map((id) => byId.get(id) ?? null).filter((book): book is PublishedBook => Boolean(book));
  const selectedIds = new Set(selectedBooks.map((book) => book.id));
  const invalidBookIds = config.selectedBookIds.filter((id) => !byId.has(id));
  const orderedBooks = [...selectedBooks, ...books.filter((book) => !selectedIds.has(book.id))];
  return {
    config,
    eligibleBooks: books,
    selectedBooks,
    invalidBookIds,
    orderedBooks,
    previewBooks: orderedBooks.slice(0, HOME_FEATURED_PREVIEW_LIMIT),
    hasCustomSelection: selectedBooks.length > 0,
  };
}
