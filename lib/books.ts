import { ApiError } from "@/lib/api/client";
import { apiServer } from "@/lib/api/server";
import { resolveBookOfferDetails } from "@/lib/book-offers";
import { resolveBookAuthorName } from "@/lib/book-authors";
import {
  CHECKOUT_BOOK_FORMATS,
  DIGITAL_BOOK_FORMATS,
  findPreferredFormat,
  isCheckoutBookFormat,
} from "@/lib/book-formats";
import type { ApiBook, ApiBookFormat, ApiPagination, BookFormatType } from "@/types/api";

type GetPublishedBooksOptions = {
  searchQuery?: string;
  category?: string;
};

type ApiFavoriteBook = ApiBook;

function numberValue(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapBook(book: ApiBook, favoriteIds = new Set<string>()) {
  const formats = (book.formats ?? []).map((format) => ({
    ...format,
    price: numberValue(format.price),
  }));
  const digitalFormat = findPreferredFormat(
    formats.filter((format) => format.is_published && DIGITAL_BOOK_FORMATS.includes(format.format as (typeof DIGITAL_BOOK_FORMATS)[number])),
    DIGITAL_BOOK_FORMATS,
  );
  const effectivePrice = numberValue(digitalFormat?.price ?? book.price);
  const currencyCode = digitalFormat?.currency_code ?? book.currency_code ?? "USD";
  const offer = resolveBookOfferDetails({
    price: effectivePrice,
    currencyCode,
    isSingleSaleEnabled: book.is_single_sale_enabled,
    isSubscriptionAvailable: book.is_subscription_available,
  });

  return {
    ...book,
    price: effectivePrice,
    currency_code: currencyCode,
    author_name: resolveBookAuthorName(book.author_display_name, book.author_display_name),
    author_avatar_url: null,
    cover_signed_url: book.cover_url,
    is_favorite: favoriteIds.has(book.id),
    is_free: offer.isFree,
    offer_mode: offer.offerMode,
    display_price_label: offer.displayPriceLabel,
    offer_summary_label: offer.offerSummaryLabel,
    book_formats: formats,
  };
}

async function getFavoriteIds() {
  try {
    const favorites = await apiServer<ApiPagination<ApiFavoriteBook>>("favorites");
    return new Set((favorites.data ?? []).map((book) => book.id));
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return new Set<string>();
    return new Set<string>();
  }
}

export async function getPublishedBooks(options: GetPublishedBooksOptions = {}) {
  const params = new URLSearchParams();
  if (options.searchQuery?.trim()) params.set("search", options.searchQuery.trim());
  if (options.category?.trim() && options.category.trim().toLowerCase() !== "all") params.set("category", options.category.trim());

  try {
    const [response, favoriteIds] = await Promise.all([
      apiServer<ApiPagination<ApiBook>>(`books${params.size ? `?${params.toString()}` : ""}`, { authenticated: false }),
      getFavoriteIds(),
    ]);
    return (response.data ?? []).filter((book) => book.status === "published" && book.copyright_status === "clear").map((book) => mapBook(book, favoriteIds));
  } catch (error) {
    console.error("[Books] Laravel API unavailable.", error);
    return [];
  }
}

export async function getComingSoonBooks() {
  try {
    const [response, favoriteIds] = await Promise.all([
      apiServer<ApiPagination<ApiBook>>("books", { authenticated: false }),
      getFavoriteIds(),
    ]);
    return (response.data ?? []).filter((book) => book.status === "coming_soon" && book.copyright_status !== "blocked").map((book) => mapBook(book, favoriteIds));
  } catch {
    return [];
  }
}

export async function getBookById(bookId: string) {
  try {
    const [response, favoriteIds] = await Promise.all([
      apiServer<{ data: ApiBook }>(`books/${encodeURIComponent(bookId)}`),
      getFavoriteIds(),
    ]);
    const book = response.data;
    const mapped = mapBook(book, favoriteIds);
    const formats = (book.formats ?? []) as ApiBookFormat[];
    const digitalFormat = findPreferredFormat(
      formats.filter((format) => format.is_published && DIGITAL_BOOK_FORMATS.includes(format.format as (typeof DIGITAL_BOOK_FORMATS)[number])),
      DIGITAL_BOOK_FORMATS,
    );
    const purchaseFormats = formats
      .filter((format): format is ApiBookFormat & { format: BookFormatType } => format.is_published && isCheckoutBookFormat(format.format))
      .sort((a, b) => CHECKOUT_BOOK_FORMATS.indexOf(a.format as never) - CHECKOUT_BOOK_FORMATS.indexOf(b.format as never));

    return {
      ...mapped,
      digital_format: digitalFormat ?? null,
      purchase_formats: purchaseFormats,
      subscription_plans: book.subscription_plans ?? [],
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    return null;
  }
}

export type PublishedBook = Awaited<ReturnType<typeof getPublishedBooks>>[number];
export type BookDetail = Awaited<ReturnType<typeof getBookById>>;
