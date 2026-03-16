import { resolveBookOfferDetails } from "@/lib/book-offers";
import { isBookCategory } from "@/lib/book-categories";
import { createClient } from "@/lib/supabase/server";
import type { BookFormatType, Database } from "@/types/database";

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
  | "price"
  | "cover_url"
  | "status"
  | "author_id"
  | "created_at"
  | "published_at"
  | "publication_date"
  | "page_count"
  | "categories"
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

type GetPublishedBooksOptions = {
  searchQuery?: string;
  category?: string;
};

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

function firstOf<T>(value: MaybeArray<T>): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function getPublishedEbookFormat(
  formats:
    | {
        format: BookFormatType;
        price: number;
        is_published: boolean;
        currency_code: string;
      }[]
    | null,
) {
  return (formats ?? []).find((format) => format.format === "ebook" && format.is_published);
}

function getDetailedEbookFormat(
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
  return (formats ?? []).find((format) => format.format === "ebook" && format.is_published);
}

async function hydrateBooks(supabase: SupabaseClient, rows: PublishedBookRow[]) {
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
    const ebook = getPublishedEbookFormat(book.book_formats);
    const author = firstOf(book.author);
    const effectivePrice = ebook?.price ?? book.price;
    const resolvedCurrencyCode = ebook?.currency_code ?? book.currency_code;
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
      author_name: author?.display_name ?? "Auteur inconnu",
      author_avatar_url: author?.avatar_url ?? null,
      cover_signed_url:
        (book.cover_url && (book.cover_url.startsWith("http://") || book.cover_url.startsWith("https://")) ? book.cover_url : null) ??
        (book.cover_url ? signedCoverByPath.get(book.cover_url) ?? null : null),
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

export async function getPublishedBooks(options: GetPublishedBooksOptions = {}) {
  const supabase = await createClient();
  const { searchQuery, category } = options;

  let query = supabase
    .from("books")
    .select(
      "id, title, subtitle, description, price, cover_url, status, author_id, created_at, published_at, publication_date, page_count, categories, currency_code, is_single_sale_enabled, is_subscription_available, author:author_profiles!books_author_profile_id_fkey(display_name, avatar_url), book_formats!left(format, price, is_published, currency_code)",
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

  return hydrateBooks(supabase, (data ?? []) as PublishedBookRow[]);
}

export async function getComingSoonBooks() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("books")
    .select(
      "id, title, subtitle, description, price, cover_url, status, author_id, created_at, published_at, publication_date, page_count, categories, currency_code, is_single_sale_enabled, is_subscription_available, author:author_profiles!books_author_profile_id_fkey(display_name, avatar_url), book_formats!left(format, price, is_published, currency_code)",
    )
    .eq("status", "coming_soon")
    .order("publication_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .returns<PublishedBookRow[]>();

  if (error) {
    return [];
  }

  return hydrateBooks(supabase, (data ?? []) as PublishedBookRow[]);
}

export async function getBookById(bookId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("books")
    .select(
      "id, title, subtitle, description, price, cover_url, status, author_id, file_url, language, publisher, publication_date, page_count, categories, tags, age_rating, currency_code, is_single_sale_enabled, is_subscription_available, author:author_profiles!books_author_profile_id_fkey(display_name, avatar_url), book_formats!left(id, format, price, file_url, downloadable, is_published, currency_code)",
    )
    .eq("id", bookId)
    .returns<BookDetailRow>()
    .single();

  const book = (data ?? null) as BookDetailRow | null;
  if (!book) return null;

  const ebook = getDetailedEbookFormat(book.book_formats);
  const author = firstOf(book.author);
  const effectivePrice = ebook?.price ?? book.price;
  const resolvedCurrencyCode = ebook?.currency_code ?? book.currency_code;
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

  return {
    ...book,
    currency_code: resolvedCurrencyCode,
    price: effectivePrice,
    file_url: ebook?.file_url ?? book.file_url,
    author_name: author?.display_name ?? "Auteur inconnu",
    author_avatar_url: author?.avatar_url ?? null,
    cover_signed_url:
      (book.cover_url && (book.cover_url.startsWith("http://") || book.cover_url.startsWith("https://")) ? book.cover_url : null) ??
      signedCover?.signedUrl ??
      null,
    subscription_plans: subscriptionPlans,
    is_free: offer.isFree,
    offer_mode: offer.offerMode,
    display_price_label: offer.displayPriceLabel,
    offer_summary_label: offer.offerSummaryLabel,
  };
}

export type PublishedBook = Awaited<ReturnType<typeof getPublishedBooks>>[number];
export type BookDetail = Awaited<ReturnType<typeof getBookById>>;
