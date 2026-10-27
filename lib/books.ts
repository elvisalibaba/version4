import { ApiError } from "@/lib/api/client";
import { isSupabaseMode } from "@/lib/data-source";
import { getSupabaseBooks, getSupabaseBookById } from "@/lib/supabase/catalog";
import { apiServer, getServerAuthToken } from "@/lib/api/server";
import { cache } from "react";
import { resolveBookOfferDetails } from "@/lib/book-offers";
import { resolveBookAuthorName } from "@/lib/book-authors";
import {
  CHECKOUT_BOOK_FORMATS,
  DIGITAL_BOOK_FORMATS,
  findPreferredFormat,
  isCheckoutBookFormat,
} from "@/lib/book-formats";
import type { ApiBook, ApiBookFormat, ApiPagination } from "@/types/api";

type GetPublishedBooksOptions = {
  searchQuery?: string;
  category?: string;
  education?: string;
  educationAudience?: "school" | "university";
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
  const apiIsFree = Boolean(book.is_free);
  const basePrice = numberValue(book.price);
  const digitalPrice = digitalFormat ? numberValue(digitalFormat.price) : null;
  const effectivePrice = apiIsFree
    ? 0
    : digitalPrice !== null && digitalPrice > 0
      ? digitalPrice
      : basePrice;
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
    rating_avg: book.rating_avg === null ? null : numberValue(book.rating_avg),
    author_name: resolveBookAuthorName(book.author_display_name, book.author_display_name),
    author_avatar_url: null,
    cover_signed_url: book.cover_url,
    cover_thumb_url: book.cover_thumbnail_url ?? null,
    is_favorite: favoriteIds.has(book.id),
    is_free: apiIsFree,
    offer_mode: offer.offerMode,
    display_price_label: offer.displayPriceLabel,
    offer_summary_label: offer.offerSummaryLabel,
    book_formats: formats,
  };
}

async function getFavoriteIds() {
  if (!(await getServerAuthToken())) return new Set<string>();
  try {
    const favorites = await apiServer<ApiPagination<ApiFavoriteBook>>("favorites");
    return new Set((favorites.data ?? []).map((book) => book.id));
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return new Set<string>();
    return new Set<string>();
  }
}

export async function getPublishedBooks(options: GetPublishedBooksOptions = {}) {
  if (isSupabaseMode()) { const result=await getSupabaseBooks({...options,perPage:100}); return result.books.map(book=>mapBook(book)); }
  const params = new URLSearchParams();
  if (options.searchQuery?.trim()) params.set("search", options.searchQuery.trim());
  if (options.category?.trim() && options.category.trim().toLowerCase() !== "all") params.set("category", options.category.trim());
  if (options.education?.trim()) params.set("education", options.education.trim());
  if (options.educationAudience) params.set("education_audience", options.educationAudience);
  params.set("view", "card");

  try {
    const [response, favoriteIds] = await Promise.all([
      apiServer<ApiPagination<ApiBook>>(`books${params.size ? `?${params.toString()}` : ""}`, { authenticated: false }),
      getFavoriteIds(),
    ]);
    return (response.data ?? []).filter((book) => book.status === "published").map((book) => mapBook(book, favoriteIds));
  } catch (error) {
    console.error("[Books] Laravel API unavailable.", error);
    return [];
  }
}

export async function getComingSoonBooks() {
  if (isSupabaseMode()) { const result=await getSupabaseBooks({status:"coming_soon",perPage:100}); return result.books.map(book=>mapBook(book)); }
  try {
    const [response, favoriteIds] = await Promise.all([
      apiServer<ApiPagination<ApiBook>>("books?view=card", { authenticated: false }),
      getFavoriteIds(),
    ]);
    return (response.data ?? []).filter((book) => book.status === "coming_soon").map((book) => mapBook(book, favoriteIds));
  } catch {
    return [];
  }
}

export const getBookById = cache(async (bookId: string) => {
  if (isSupabaseMode()) { const book=await getSupabaseBookById(bookId); if(!book)return null;const mapped=mapBook(book);return {...mapped,digital_format:null,purchase_formats:[],subscription_plans:[]}; }
  try {
    const [response, favoriteIds] = await Promise.all([
      apiServer<{ data: ApiBook }>(`books/${encodeURIComponent(bookId)}`, { authenticated: false }),
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
      .filter((format): format is ApiBookFormat & { format: import("@/lib/book-formats").CheckoutBookFormat } =>
        format.is_published && isCheckoutBookFormat(format.format),
      )
      .map((format) => ({ ...format, price: numberValue(format.price) }))
      .sort((a, b) => CHECKOUT_BOOK_FORMATS.indexOf(a.format) - CHECKOUT_BOOK_FORMATS.indexOf(b.format));

    return {
      ...mapped,
      digital_format: digitalFormat ?? null,
      purchase_formats: purchaseFormats,
      subscription_plans: (book.subscription_plans ?? []).map((plan) => ({
        ...plan,
        monthly_price: numberValue(plan.monthly_price),
        is_active: plan.is_active ?? true,
      })),
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    return null;
  }
});

export type PublishedBook = Awaited<ReturnType<typeof getPublishedBooks>>[number];
export type BookDetail = Awaited<ReturnType<typeof getBookById>>;

/** Livres mis en avant sur l'accueil (sélection Laravel), à défaut les dernières parutions. */
export async function getHomeFeaturedBooks(limit = 4) {
  if (isSupabaseMode()) return (await getPublishedBooks()).slice(0,limit);
  try {
    const response = await apiServer<{ data: ApiBook[] }>("home/featured", { authenticated: false });
    const featured = (response.data ?? []).map((book) => mapBook(book));
    if (featured.length > 0) return featured.slice(0, limit);
  } catch (error) {
    console.error("[Books] Home featured unavailable.", error);
  }
  return (await getPublishedBooks()).slice(0, limit);
}

export type CatalogueResult =
  | { status: "ok"; books: PublishedBook[]; total: number; currentPage: number; lastPage: number }
  | { status: "error" };

/** Page du catalogue telle que filtrée et triée par l'API (query issue de catalogueApiQuery). */
export async function getCataloguePage(query: string): Promise<CatalogueResult> {
  if (isSupabaseMode()) {try { const params=new URLSearchParams(query);const result=await getSupabaseBooks({searchQuery:params.get("search")??params.get("q")??undefined,category:params.get("category")??undefined,page:Number(params.get("page")??1),perPage:Number(params.get("per_page")??24)});return {status:"ok",books:result.books.map(book=>mapBook(book)),total:result.total,currentPage:result.page,lastPage:result.lastPage};}catch{return {status:"error"};}}
  try {
    const [response, favoriteIds] = await Promise.all([
      apiServer<ApiPagination<ApiBook>>(`books?${query}${query ? "&" : ""}view=card`, { authenticated: false }),
      getFavoriteIds(),
    ]);
    const books = (response.data ?? []).map((book) => mapBook(book, favoriteIds));
    return {
      status: "ok",
      books,
      total: response.meta?.total ?? books.length,
      currentPage: response.meta?.current_page ?? 1,
      lastPage: response.meta?.last_page ?? 1,
    };
  } catch (error) {
    console.error("[Books] Catalogue unavailable.", error);
    return { status: "error" };
  }
}

/** Sélection « vente flash » configurée dans l'administration. */
export async function getFlashSaleBooks() {
  if (isSupabaseMode()) return {discountPercentage:0,books:[]};
  try {
    const response = await apiServer<{ discount_percentage: number; books: ApiBook[] }>("home/flash-sale", { authenticated: false });
    return { discountPercentage: response.discount_percentage ?? 0, books: (response.books ?? []).map((book) => mapBook(book)) };
  } catch {
    return { discountPercentage: 0, books: [] };
  }
}
