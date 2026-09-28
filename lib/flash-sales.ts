import "server-only";

import type { PublishedBook } from "@/lib/books";
import { apiServer } from "@/lib/api/server";

const FLASH_SALE_DISPLAY_LIMIT = 3;

export type FlashSaleConfig = {
  selectedBookIds: string[];
  discountPercentage: number;
  updatedAt: string;
};

export async function getFlashSaleConfig(): Promise<FlashSaleConfig> {
  try {
    const response = await apiServer<{
      discount_percentage: number;
      selected_book_ids: string[];
    }>("home/flash-sale", { authenticated: false });

    return {
      selectedBookIds: response.selected_book_ids ?? [],
      discountPercentage: response.discount_percentage ?? 20,
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return { selectedBookIds: [], discountPercentage: 20, updatedAt: new Date().toISOString() };
  }
}

export async function saveFlashSaleConfig(_config: FlashSaleConfig) {
  throw new Error("La configuration des ventes flash se gère désormais dans Laravel.");
}
export async function updateFlashSaleDiscount(_discountPercentage: number) { return saveFlashSaleConfig(await getFlashSaleConfig()); }
export async function addBookToFlashSale(_bookId: string) { return saveFlashSaleConfig(await getFlashSaleConfig()); }
export async function removeBookFromFlashSale(_bookId: string) { return saveFlashSaleConfig(await getFlashSaleConfig()); }
export async function clearFlashSaleBooks() { return saveFlashSaleConfig(await getFlashSaleConfig()); }

export async function getFlashSaleState(books: PublishedBook[]) {
  const config = await getFlashSaleConfig();
  const eligibleBooks = books.filter((book) => book.is_single_sale_enabled && !book.is_free);
  const byId = new Map(eligibleBooks.map((book) => [book.id, book]));
  const selectedBooks = config.selectedBookIds.map((id) => byId.get(id) ?? null).filter((book): book is PublishedBook => Boolean(book));
  const invalidBookIds = config.selectedBookIds.filter((id) => !byId.has(id));
  const dealBooks: Array<PublishedBook | null> = [...selectedBooks];
  for (const book of eligibleBooks) {
    if (dealBooks.length >= FLASH_SALE_DISPLAY_LIMIT) break;
    if (!dealBooks.some((entry) => entry?.id === book.id)) dealBooks.push(book);
  }
  while (dealBooks.length < FLASH_SALE_DISPLAY_LIMIT) dealBooks.push(null);
  return {
    config,
    eligibleBooks,
    selectedBooks,
    invalidBookIds,
    fallbackBooks: eligibleBooks.slice(0, FLASH_SALE_DISPLAY_LIMIT),
    dealBooks: dealBooks.slice(0, FLASH_SALE_DISPLAY_LIMIT),
    hasCustomSelection: selectedBooks.length > 0,
  };
}
