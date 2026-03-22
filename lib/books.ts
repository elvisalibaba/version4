import { resolveBookOfferDetails } from "@/lib/book-offers";
import { resolveBookAuthorName } from "@/lib/book-authors";
import { isBookCopyrightBlocked } from "@/lib/book-copyright";
import {
  CHECKOUT_BOOK_FORMATS,
  DIGITAL_BOOK_FORMATS,
  findPreferredFormat,
  isCheckoutBookFormat,
} from "@/lib/book-formats";
import { createClient } from "@/lib/supabase/server";
import type { BookFormatType, Database } from "@/types/database";

type PurchasableCheckoutFormat = (typeof CHECKOUT_BOOK_FORMATS)[number];

type MaybeArray<T> = T | T[] | null;

type AuthorSummary = {
  display_name: string | null;
  avatar_url: string | null;
};

type PlanSummary = Pick<
  Database["public"]["Tables"]["subscription_plans"]["Row"],
  "id" | "name" | "slug" | "monthly_price" | "currency_code" | "is_active"
>;

type PublishedBookRow = Pick<
  Database["public"]["Tables"]["books"]["Row"],
  | "id"
  | "title"
  | "subtitle"
  | "description"
  | "author_display_name"
  | "price"
  | "cover_url"
  | "status"
  | "author_id"
  | "created_at"
  | "copyright_status"
  | "published_at"
  | "publication_date"
  | "page_count"
  | "categories"
  | "views_count"
  | "purchases_count"
  | "rating_avg"
  | "ratings_count"
  | "currency_code"
  | "is_single_sale_enabled"
  | "is_subscription_available"
> & {
  author: MaybeArray<AuthorSummary>;
  book_formats:
    | {
        format: BookFormatType;
        price: number;
        is_published: boolean;
        currency_code: string;
      }[]
    | null;
};

type BookDetailRow = Pick<
  Database["public"]["Tables"]["books"]["Row"],
  | "id"
  | "title"
  | "subtitle"
  | "description"
  | "author_display_name"
  | "price"
  | "cover_url"
  | "status"
  | "author_id"
  | "file_url"
  | "copyright_status"
  | "language"
  | "publisher"
  | "publication_date"
  | "page_count"
  | "categories"
  | "tags"
  | "age_rating"
  | "currency_code"
  | "is_single_sale_enabled"
  | "is_subscription_available"
> & {
  author: MaybeArray<AuthorSummary>;
  book_formats:
    | {
        id: string;
        format: BookFormatType;
        price: number;
        file_url: string | null;
        downloadable: boolean;
        is_published: boolean;
        currency_code: string;
      }[]
    | null;
};

type SubscriptionPlanBookRow = {
  plan_id: string;
  subscription_plans: MaybeArray<PlanSummary>;
};

type ReaderRoleRow = Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "role">;
type BookFavoriteRow = Pick<Database["public"]["Tables"]["book_favorites"]["Row"], "book_id">;

type GetPublishedBooksOptions = {
  searchQuery?: string;
  category?: string;
};

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

function isNextDynamicServerUsageError(error: unknown) {
  return typeof error === "object" && error !== null && "digest" in error && (error as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE";
}

function firstOf<T>(value: MaybeArray<T>): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function getPublishedDigitalFormat(
  formats:
    | {
        format: BookFormatType;
        price: number;
        is_published: boolean;
        currency_code: string;
      }[]
    | null,
) {
  return findPreferredFormat(
    (formats ?? []).filter((format) => format.is_published && DIGITAL_BOOK_FORMATS.includes(format.format as (typeof DIGITAL_BOOK_FORMATS)[number])),
    DIGITAL_BOOK_FORMATS,
  );
}

function getDetailedDigitalFormat(
  formats:
    | {
        id: string;
        format: BookFormatType;
        price: number;
        file_url: string | null;
        downloadable: boolean;
        is_published: boolean;
        currency_code: string;
      }[]
    | null,
) {
  return findPreferredFormat(
    (formats ?? []).filter((format) => format.is_published && DIGITAL_BOOK_FORMATS.includes(format.format as (typeof DIGITAL_BOOK_FORMATS)[number])),
    DIGITAL_BOOK_FORMATS,
  );
}

function getPublishedPurchaseFormats(
  formats:
    | {
        id: string;
        format: BookFormatType;
        price: number;
        file_url: string | null;
        downloadable: boolean;
        is_published: boolean;
        currency_code: string;
      }[]
    | null,
) {
  const published = (formats ?? []).filter(
    (
      format,
    ): format is {
      id: string;
      format: PurchasableCheckoutFormat;
      price: number;
      file_url: string | null;
        downloadable: boolean;
        is_published: boolean;
        currency_code: string;
    } => format.is_published && isCheckoutBookFormat(format.format),
  );

  return published.sort((left, right) => CHECKOUT_BOOK_FORMATS.indexOf(left.format) - CHECKOUT_BOOK_FORMATS.indexOf(right.format));
}

async function hydrateBooks(supabase: SupabaseClient, rows: PublishedBookRow[]) {
  const favoriteBookIds = await getAuthenticatedFavoriteBookIds(
    supabase,
    rows.map((book) => book.id),
  );
  const coverPaths = rows
    .map((book) => book.cover_url)
    .filter((path): path is string => typeof path === "string" && path.length > 0 && !path.startsWith("http://") && !path.startsWith("https://"));

  const signedCoverByPath = new Map<string, string>();
  await Promise.all(
    coverPaths.map(async (path) => {
      const { data: signed } = await supabase.storage.from("books").createSignedUrl(path, 60 * 60);
      if (signed?.signedUrl) {
        signedCoverByPath.set(path, signed.signedUrl);
      }
    }),
  );

  return rows.map((book) => {
    const digitalFormat = getPublishedDigitalFormat(book.book_formats);
    const author = firstOf(book.author);
    const effectivePrice = digitalFormat?.price ?? book.price;
    const resolvedCurrencyCode = digitalFormat?.currency_code ?? book.currency_code;
    const offer = resolveBookOfferDetails({
      price: effectivePrice,
      currencyCode: resolvedCurrencyCode,
      isSingleSaleEnabled: book.is_single_sale_enabled,
      isSubscriptionAvailable: book.is_subscription_available,
    });

    return {
      ...book,
      currency_code: resolvedCurrencyCode,
      price: effectivePrice,
      author_name: resolveBookAuthorName(book.author_display_name, author?.display_name),
      author_avatar_url: author?.avatar_url ?? null,
      cover_signed_url:
        (book.cover_url && (book.cover_url.startsWith("http://") || book.cover_url.startsWith("https://")) ? book.cover_url : null) ??
        (book.cover_url ? signedCoverByPath.get(book.cover_url) ?? null : null),
      is_favorite: favoriteBookIds.has(book.id),
      is_free: offer.isFree,
      offer_mode: offer.offerMode,
      display_price_label: offer.displayPriceLabel,
      offer_summary_label: offer.offerSummaryLabel,
    };
  });
}

async function getBookSubscriptionPlans(supabase: SupabaseClient, bookId: string) {
  const { data } = await supabase
    .from("subscription_plan_books")
    .select("plan_id, subscription_plans(id, name, slug, monthly_price, currency_code, is_active)")
    .eq("book_id", bookId)
    .returns<SubscriptionPlanBookRow[]>();

  return (data ?? [])
    .map((entry) => firstOf(entry.subscription_plans))
    .filter((plan): plan is PlanSummary => Boolean(plan));
}

async function getAuthenticatedFavoriteBookIds(supabase: SupabaseClient, bookIds: string[]) {
  if (bookIds.length === 0) {
    return new Set<string>();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Set<string>();
  }

  const { data: profileDataRaw, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();
  const profileData = (profileDataRaw ?? null) as ReaderRoleRow | null;

  if (profileError || profileData?.role !== "reader") {
    return new Set<string>();
  }

  const { data: favoriteRowsRaw, error: favoriteError } = await supabase
    .from("book_favorites")
    .select("book_id")
    .eq("user_id", profileData.id)
    .in("book_id", bookIds)
    .returns<BookFavoriteRow[]>();
  const favoriteRows = (favoriteRowsRaw ?? []) as BookFavoriteRow[];

  if (favoriteError) {
    console.warn("[Books] Unable to resolve favorite books for current reader.", favoriteError.message);
    return new Set<string>();
  }

  return new Set(favoriteRows.map((favorite) => favorite.book_id));
}

export async function getPublishedBooks(options: GetPublishedBooksOptions = {}) {
  try {
    const supabase = await createClient();
    const { searchQuery, category } = options;

    let query = supabase
      .from("books")
      .select(
        "id, title, subtitle, description, author_display_name, price, cover_url, status, author_id, created_at, copyright_status, published_at, publication_date, page_count, categories, views_count, purchases_count, rating_avg, ratings_count, currency_code, is_single_sale_enabled, is_subscription_available, author:author_profiles!books_author_profile_id_fkey(display_name, avatar_url), book_formats!left(format, price, is_published, currency_code)",
      )
      .eq("status", "published")
      .neq("copyright_status", "blocked")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    const categoryTerm = category?.trim();
    if (categoryTerm && categoryTerm.toLowerCase() !== "all") {
      query = query.contains("categories", [categoryTerm]);
    }

    const term = searchQuery?.trim();
    if (term) {
      const safeTerm = term.replace(/[%_,]/g, " ");
      query = query.or(`title.ilike.%${safeTerm}%,subtitle.ilike.%${safeTerm}%,author_display_name.ilike.%${safeTerm}%`);
    }

    const { data, error } = await query.returns<PublishedBookRow[]>();

    if (error) {
      return [];
    }

    return hydrateBooks(supabase, (data ?? []) as PublishedBookRow[]);
  } catch (error) {
    if (isNextDynamicServerUsageError(error)) {
      throw error;
    }
    console.error("[Books] Failed to fetch published books. Returning empty list.", error);
    return [];
  }
}

export async function getComingSoonBooks() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("books")
      .select(
        "id, title, subtitle, description, author_display_name, price, cover_url, status, author_id, created_at, copyright_status, published_at, publication_date, page_count, categories, views_count, purchases_count, rating_avg, ratings_count, currency_code, is_single_sale_enabled, is_subscription_available, author:author_profiles!books_author_profile_id_fkey(display_name, avatar_url), book_formats!left(format, price, is_published, currency_code)",
      )
      .eq("status", "coming_soon")
      .neq("copyright_status", "blocked")
      .order("publication_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .returns<PublishedBookRow[]>();

    if (error) {
      return [];
    }

    return hydrateBooks(supabase, (data ?? []) as PublishedBookRow[]);
  } catch (error) {
    if (isNextDynamicServerUsageError(error)) {
      throw error;
    }
    console.error("[Books] Failed to fetch coming-soon books. Returning empty list.", error);
    return [];
  }
}

export async function getBookById(bookId: string) {
  try {
    const supabase = await createClient();

    const { data } = await supabase
      .from("books")
      .select(
        "id, title, subtitle, description, author_display_name, price, cover_url, status, author_id, file_url, copyright_status, language, publisher, publication_date, page_count, categories, tags, age_rating, currency_code, is_single_sale_enabled, is_subscription_available, author:author_profiles!books_author_profile_id_fkey(display_name, avatar_url), book_formats!left(id, format, price, file_url, downloadable, is_published, currency_code)",
      )
      .eq("id", bookId)
      .returns<BookDetailRow>()
      .single();

    const book = (data ?? null) as BookDetailRow | null;
    if (!book || isBookCopyrightBlocked(book.copyright_status)) return null;

    const digitalFormat = getDetailedDigitalFormat(book.book_formats);
    const purchasableFormats = getPublishedPurchaseFormats(book.book_formats);
    const primaryPurchaseFormat = digitalFormat ?? purchasableFormats[0] ?? null;
    const author = firstOf(book.author);
    const effectivePrice = primaryPurchaseFormat?.price ?? book.price;
    const resolvedCurrencyCode = primaryPurchaseFormat?.currency_code ?? book.currency_code;
    const offer = resolveBookOfferDetails({
      price: effectivePrice,
      currencyCode: resolvedCurrencyCode,
      isSingleSaleEnabled: book.is_single_sale_enabled,
      isSubscriptionAvailable: book.is_subscription_available,
    });

    const shouldSignCover = book.cover_url && !book.cover_url.startsWith("http://") && !book.cover_url.startsWith("https://");
    const { data: signedCover } =
      shouldSignCover && book.cover_url
        ? await supabase.storage.from("books").createSignedUrl(book.cover_url, 60 * 60)
        : { data: null };

    const subscriptionPlans = book.is_subscription_available ? await getBookSubscriptionPlans(supabase, book.id) : [];
    const favoriteBookIds = await getAuthenticatedFavoriteBookIds(supabase, [book.id]);
    const purchaseFormats =
      purchasableFormats.length > 0
        ? purchasableFormats.map((format) => ({
            format: format.format,
            price: format.price,
            currency_code: format.currency_code,
          }))
        : book.is_single_sale_enabled
          ? [
              {
                format: "ebook" as const,
                price: book.price,
                currency_code: book.currency_code,
              },
            ]
          : [];

    return {
      ...book,
      currency_code: resolvedCurrencyCode,
      price: effectivePrice,
      file_url: digitalFormat?.file_url ?? book.file_url,
      author_name: resolveBookAuthorName(book.author_display_name, author?.display_name),
      author_avatar_url: author?.avatar_url ?? null,
      cover_signed_url:
        (book.cover_url && (book.cover_url.startsWith("http://") || book.cover_url.startsWith("https://")) ? book.cover_url : null) ??
        signedCover?.signedUrl ??
        null,
      is_favorite: favoriteBookIds.has(book.id),
      purchase_formats: purchaseFormats,
      subscription_plans: subscriptionPlans,
      is_free: offer.isFree,
      offer_mode: offer.offerMode,
      display_price_label: offer.displayPriceLabel,
      offer_summary_label: offer.offerSummaryLabel,
    };
  } catch (error) {
    if (isNextDynamicServerUsageError(error)) {
      throw error;
    }
    console.error(`[Books] Failed to fetch book ${bookId}. Returning null.`, error);
    return null;
  }
}

export type PublishedBook = Awaited<ReturnType<typeof getPublishedBooks>>[number];
export type BookDetail = Awaited<ReturnType<typeof getBookById>>;
