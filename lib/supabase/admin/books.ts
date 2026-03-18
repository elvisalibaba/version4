import { createClient } from "@/lib/supabase/server";
import {
  ADMIN_DEFAULT_PAGE_SIZE,
  buildPagination,
  firstOf,
  getPaginationRange,
  isBookReviewStatus,
  normalizeSearchTerm,
  parseBooleanFilter,
  resolveAssetUrl,
  safeLikeTerm,
  signBookAssetPaths,
  type AdminAuthorMini,
  type AdminBookMini,
  type AdminPlanMini,
  type AdminProfileMini,
  type MaybeArray,
} from "@/lib/supabase/admin/shared";
import type { AdminNotice, AdminOption, AdminPagedResult } from "@/types/admin";
import type { BookEngagementEventType, BookFormatType, BookReviewStatus, BookStatus } from "@/types/database";

type BookAuthorRow = AdminBookMini & {
  author_profile: MaybeArray<Pick<AdminAuthorMini, "id" | "display_name" | "avatar_url">>;
  author_profile_fallback: MaybeArray<Pick<AdminProfileMini, "id" | "name" | "email">>;
};

type BookListRow = BookAuthorRow;

type BookFormatRow = {
  id: string;
  book_id: string;
  format: BookFormatType;
  price: number;
  currency_code: string;
  downloadable: boolean;
  is_published: boolean;
  stock_quantity: number | null;
  file_size_mb: number | null;
  file_url: string | null;
  printing_cost: number | null;
  created_at: string;
  updated_at: string;
};

type RelatedOrderItemRow = {
  id: string;
  order_id: string;
  book_id: string;
  price: number;
  currency_code: string;
  book_format: BookFormatType;
  order: MaybeArray<{
    id: string;
    user_id: string;
    total_price: number;
    currency_code: string;
    payment_status: "pending" | "paid" | "failed" | "refunded";
    created_at: string;
  }>;
};

type RelatedLibraryRow = {
  id: string;
  user_id: string;
  book_id: string;
  purchased_at: string;
  access_type: "purchase" | "subscription" | "free";
  subscription_id: string | null;
  user: MaybeArray<Pick<AdminProfileMini, "id" | "name" | "email" | "role">>;
};

type RelatedRatingRow = {
  id: string;
  user_id: string;
  book_id: string;
  rating: number;
  created_at: string;
  updated_at: string;
  user: MaybeArray<Pick<AdminProfileMini, "id" | "name" | "email" | "role">>;
};

type RelatedHighlightRow = {
  id: string;
  user_id: string;
  book_id: string;
  page: number;
  text: string | null;
  note: string | null;
  color: string;
  created_at: string;
  updated_at: string;
  user: MaybeArray<Pick<AdminProfileMini, "id" | "name" | "email" | "role">>;
};

type PlanMappingRow = {
  id: string;
  plan_id: string;
  book_id: string;
  created_at: string;
  plan: MaybeArray<Pick<AdminPlanMini, "id" | "name" | "slug" | "is_active">>;
};

type OrderMetaRow = {
  id: string;
  user_id: string;
  total_price: number;
  currency_code: string;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  created_at: string;
};

type BookEngagementRow = {
  id: string;
  book_id: string;
  user_id: string | null;
  event_type: BookEngagementEventType;
  source: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
  user: MaybeArray<Pick<AdminProfileMini, "id" | "name" | "email" | "role">>;
};

type BookDetailRow = BookAuthorRow & {
  description: string | null;
  author_id: string;
  file_url: string | null;
  updated_at: string;
  co_authors: string[];
  isbn: string | null;
  publisher: string | null;
  page_count: number | null;
  tags: string[];
  age_rating: string | null;
  edition: string | null;
  series_name: string | null;
  series_position: number | null;
  file_format: string | null;
  file_size: number | null;
  sample_url: string | null;
  sample_pages: number | null;
  cover_thumbnail_url: string | null;
  cover_alt_text: string | null;
};

export type AdminBookListItem = BookListRow & {
  cover_signed_url: string | null;
  author_name: string;
  reviewer_name: string | null;
};

export type AdminBooksPageData = AdminPagedResult<AdminBookListItem> & {
  filterOptions: {
    statuses: AdminOption[];
    reviewStatuses: AdminOption[];
    languages: AdminOption[];
    categories: AdminOption[];
    authors: AdminOption[];
  };
  notices: AdminNotice[];
};

export type AdminBookDetail = {
  book: BookAuthorRow & {
    description: string | null;
    author_id: string;
    file_url: string | null;
    updated_at: string;
    co_authors: string[];
    isbn: string | null;
    publisher: string | null;
    page_count: number | null;
    tags: string[];
    age_rating: string | null;
    edition: string | null;
    series_name: string | null;
    series_position: number | null;
    file_format: string | null;
    file_size: number | null;
    sample_url: string | null;
    sample_pages: number | null;
    cover_thumbnail_url: string | null;
    cover_alt_text: string | null;
    cover_signed_url: string | null;
    author_name: string;
    reviewer_name: string | null;
  };
  formats: BookFormatRow[];
  orders: Array<RelatedOrderItemRow & { order_meta: OrderMetaRow | null }>;
  libraryEntries: Array<RelatedLibraryRow & { user_name: string }>;
  ratings: Array<RelatedRatingRow & { user_name: string }>;
  highlights: Array<RelatedHighlightRow & { user_name: string }>;
  engagement: {
    detailViews: number;
    readerOpens: number;
    fileAccesses: number;
    authenticatedEvents: number;
    uniqueUsers: number;
  };
  engagementEvents: Array<BookEngagementRow & { user_name: string }>;
  subscriptionMappings: Array<PlanMappingRow & { plan_name: string }>;
  editorialTimeline: Array<{ label: string; value: string | null }>;
  notices: AdminNotice[];
};

type BooksSortKey = "views" | "purchases" | "rating" | "recent";

async function getReviewerNameMap(supabase: Awaited<ReturnType<typeof createClient>>, reviewerIds: Array<string | null | undefined>) {
  const validReviewerIds = Array.from(new Set(reviewerIds.filter((value): value is string => Boolean(value))));
  if (validReviewerIds.length === 0) return new Map<string, string>();

  const { data } = await supabase.from("profiles").select("id, name, email").in("id", validReviewerIds);
  return new Map((data ?? []).map((profile) => [profile.id, profile.name ?? profile.email]));
}

export async function listAdminBooks(params: {
  page?: number;
  search?: string;
  status?: BookStatus | "";
  language?: string;
  authorId?: string;
  category?: string;
  reviewStatus?: BookReviewStatus | "";
  singleSaleEnabled?: string;
  subscriptionAvailable?: string;
  sort?: BooksSortKey;
}): Promise<AdminBooksPageData> {
  const supabase = await createClient();
  const page = params.page ?? 1;
  const search = normalizeSearchTerm(params.search);
  const { from, to } = getPaginationRange(page, ADMIN_DEFAULT_PAGE_SIZE);
  const notices: AdminNotice[] = [];

  let query = supabase
    .from("books")
    .select(
      "id, title, subtitle, status, cover_url, price, currency_code, views_count, purchases_count, rating_avg, ratings_count, publication_date, published_at, created_at, language, categories, is_single_sale_enabled, is_subscription_available, review_status, submitted_at, reviewed_at, reviewed_by, review_note, author_profile:author_profiles!books_author_profile_id_fkey(id, display_name, avatar_url), author_profile_fallback:profiles!books_author_id_fkey(id, name, email)",
      { count: "exact" },
    );

  if (params.status) {
    query = query.eq("status", params.status);
  }

  if (params.language) {
    query = query.eq("language", params.language);
  }

  if (params.authorId) {
    query = query.eq("author_id", params.authorId);
  }

  if (params.category) {
    query = query.contains("categories", [params.category]);
  }

  if (params.reviewStatus && isBookReviewStatus(params.reviewStatus)) {
    query = query.eq("review_status", params.reviewStatus);
  }

  const singleSaleFilter = parseBooleanFilter(params.singleSaleEnabled);
  if (singleSaleFilter !== null) {
    query = query.eq("is_single_sale_enabled", singleSaleFilter);
  }

  const subscriptionFilter = parseBooleanFilter(params.subscriptionAvailable);
  if (subscriptionFilter !== null) {
    query = query.eq("is_subscription_available", subscriptionFilter);
  }

  if (search) {
    const term = safeLikeTerm(search);
    query = query.or(`title.ilike.%${term}%,subtitle.ilike.%${term}%,description.ilike.%${term}%,isbn.ilike.%${term}%`);
  }

  switch (params.sort) {
    case "views":
      query = query.order("views_count", { ascending: false }).order("published_at", { ascending: false, nullsFirst: false });
      break;
    case "purchases":
      query = query.order("purchases_count", { ascending: false }).order("published_at", { ascending: false, nullsFirst: false });
      break;
    case "rating":
      query = query.order("rating_avg", { ascending: false, nullsFirst: false }).order("ratings_count", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  const { data, count, error } = await query.range(from, to).returns<BookListRow[]>();

  const [authorsResult, metadataRowsResult] = await Promise.all([
    supabase.from("author_profiles").select("id, display_name").order("display_name", { ascending: true }),
    supabase.from("books").select("language, categories"),
  ]);

  if (error) {
    return {
      items: [],
      pagination: buildPagination(0, page, ADMIN_DEFAULT_PAGE_SIZE),
      filterOptions: {
        statuses: [],
        reviewStatuses: [],
        languages: [],
        categories: [],
        authors: [],
      },
      notices: [
        {
          id: "books-load-error",
          tone: "danger",
          title: "Impossible de charger les livres",
          description: error.message,
        },
      ],
    };
  }

  const signedMap = await signBookAssetPaths(
    supabase,
    (data ?? []).map((book) => book.cover_url),
  );
  const reviewerNameMap = await getReviewerNameMap(
    supabase,
    (data ?? []).map((book) => book.reviewed_by),
  );

  const metadataRows = metadataRowsResult.data ?? [];
  const uniqueLanguages = Array.from(new Set(metadataRows.map((row) => row.language).filter(Boolean))).sort();
  const uniqueCategories = Array.from(
    new Set(metadataRows.flatMap((row) => row.categories ?? []).filter(Boolean)),
  ).sort();

  return {
    items: (data ?? []).map((book) => ({
      ...book,
      cover_signed_url: resolveAssetUrl(book.cover_url, signedMap),
      author_name: firstOf(book.author_profile)?.display_name ?? firstOf(book.author_profile_fallback)?.name ?? "Auteur inconnu",
      reviewer_name: book.reviewed_by ? reviewerNameMap.get(book.reviewed_by) ?? null : null,
    })),
    pagination: buildPagination(count, page, ADMIN_DEFAULT_PAGE_SIZE),
    filterOptions: {
      statuses: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
        { label: "Archived", value: "archived" },
        { label: "Coming soon", value: "coming_soon" },
      ],
      reviewStatuses: [
        { label: "Draft", value: "draft" },
        { label: "Submitted", value: "submitted" },
        { label: "Approved", value: "approved" },
        { label: "Changes requested", value: "changes_requested" },
        { label: "Rejected", value: "rejected" },
      ],
      languages: uniqueLanguages.map((language) => ({ label: language.toUpperCase(), value: language })),
      categories: uniqueCategories.map((category) => ({ label: category, value: category })),
      authors: (authorsResult.data ?? []).map((author) => ({ label: author.display_name, value: author.id })),
    },
    notices,
  };
}

export async function getAdminBookDetail(bookId: string): Promise<AdminBookDetail | null> {
  const supabase = await createClient();
  const notices: AdminNotice[] = [
    {
      id: "price-layering",
      tone: "info",
      title: "Lecture du prix",
      description:
        "books.price represente le prix vitrine principal, tandis que book_formats.price represente le prix specifique par format. L admin affiche les deux niveaux sans les fusionner.",
    },
    {
      id: "derived-stats",
      tone: "warning",
      title: "Compteurs potentiellement derives",
      description:
        "views_count, purchases_count, rating_avg et ratings_count sont affiches tels qu ils existent en base. Si aucun trigger ou job ne les resynchronise, ils peuvent etre approximatifs.",
    },
    {
      id: "review-workflow",
      tone: "info",
      title: "Workflow de revue",
      description:
        "review_status pilote maintenant la soumission auteur. Les auteurs restent en draft jusqu a validation admin, puis l admin choisit la publication ou la demande de corrections.",
    },
  ];

  const bookResult = await supabase
    .from("books")
    .select(
      "id, title, subtitle, description, price, author_id, cover_url, file_url, status, created_at, updated_at, co_authors, isbn, language, publisher, publication_date, page_count, categories, tags, age_rating, edition, series_name, series_position, file_format, file_size, sample_url, sample_pages, cover_thumbnail_url, cover_alt_text, published_at, views_count, purchases_count, rating_avg, ratings_count, currency_code, is_single_sale_enabled, is_subscription_available, review_status, submitted_at, reviewed_at, reviewed_by, review_note, author_profile:author_profiles!books_author_profile_id_fkey(id, display_name, avatar_url), author_profile_fallback:profiles!books_author_id_fkey(id, name, email)",
    )
    .eq("id", bookId)
    .returns<BookDetailRow>()
    .maybeSingle();

  const book = (bookResult.data ?? null) as BookDetailRow | null;

  if (!book) {
    return null;
  }

  const [formatsResult, ordersResult, libraryResult, ratingsResult, highlightsResult, engagementResult, planMappingsResult, coverMap, reviewerNameMap] = await Promise.all([
    supabase
      .from("book_formats")
      .select("id, book_id, format, price, currency_code, downloadable, is_published, stock_quantity, file_size_mb, file_url, printing_cost, created_at, updated_at")
      .eq("book_id", bookId)
      .order("created_at", { ascending: false })
      .returns<BookFormatRow[]>(),
    supabase
      .from("order_items")
      .select(
        "id, order_id, book_id, price, currency_code, book_format, order:orders!order_items_order_id_fkey(id, user_id, total_price, currency_code, payment_status, created_at)",
      )
      .eq("book_id", bookId)
      .order("order_id", { ascending: false })
      .returns<RelatedOrderItemRow[]>(),
    supabase
      .from("library")
      .select("id, user_id, book_id, purchased_at, access_type, subscription_id, user:profiles!library_user_id_fkey(id, name, email, role)")
      .eq("book_id", bookId)
      .order("purchased_at", { ascending: false })
      .returns<RelatedLibraryRow[]>(),
    supabase
      .from("ratings")
      .select("id, user_id, book_id, rating, created_at, updated_at, user:profiles!ratings_user_id_fkey(id, name, email, role)")
      .eq("book_id", bookId)
      .order("created_at", { ascending: false })
      .returns<RelatedRatingRow[]>(),
    supabase
      .from("highlights")
      .select("id, user_id, book_id, page, text, note, color, created_at, updated_at, user:profiles!highlights_user_id_fkey(id, name, email, role)")
      .eq("book_id", bookId)
      .order("created_at", { ascending: false })
      .returns<RelatedHighlightRow[]>(),
    supabase
      .from("book_engagement_events")
      .select("id, book_id, user_id, event_type, source, created_at, metadata, user:profiles!book_engagement_events_user_id_fkey(id, name, email, role)")
      .eq("book_id", bookId)
      .order("created_at", { ascending: false })
      .limit(30)
      .returns<BookEngagementRow[]>(),
    supabase
      .from("subscription_plan_books")
      .select("id, plan_id, book_id, created_at, plan:subscription_plans(id, name, slug, is_active)")
      .eq("book_id", bookId)
      .returns<PlanMappingRow[]>(),
    signBookAssetPaths(supabase, [book.cover_url]),
    getReviewerNameMap(supabase, [book.reviewed_by]),
  ]);

  if (ratingsResult.error) {
    notices.push({
      id: "ratings-unavailable",
      tone: "warning",
      title: "Notes indisponibles",
      description: ratingsResult.error.message,
    });
  }

  if (highlightsResult.error) {
    notices.push({
      id: "highlights-unavailable",
      tone: "warning",
      title: "Highlights indisponibles",
      description: highlightsResult.error.message,
    });
  }

  if (engagementResult.error) {
    notices.push({
      id: "engagement-unavailable",
      tone: "warning",
      title: "Engagement livre indisponible",
      description: engagementResult.error.message,
    });
  }

  const engagementRows = engagementResult.data ?? [];

  return {
    book: {
      ...book,
      cover_signed_url: resolveAssetUrl(book.cover_url, coverMap),
      author_name: firstOf(book.author_profile)?.display_name ?? firstOf(book.author_profile_fallback)?.name ?? "Auteur inconnu",
      reviewer_name: book.reviewed_by ? reviewerNameMap.get(book.reviewed_by) ?? null : null,
    },
    formats: formatsResult.data ?? [],
    orders: (ordersResult.data ?? []).map((item) => ({
      ...item,
      order_meta: firstOf(item.order),
    })),
    libraryEntries: (libraryResult.data ?? []).map((entry) => ({
      ...entry,
      user_name: firstOf(entry.user)?.name ?? firstOf(entry.user)?.email ?? "Utilisateur inconnu",
    })),
    ratings: (ratingsResult.data ?? []).map((entry) => ({
      ...entry,
      user_name: firstOf(entry.user)?.name ?? firstOf(entry.user)?.email ?? "Utilisateur inconnu",
    })),
    highlights: (highlightsResult.data ?? []).map((entry) => ({
      ...entry,
      user_name: firstOf(entry.user)?.name ?? firstOf(entry.user)?.email ?? "Utilisateur inconnu",
    })),
    engagement: {
      detailViews: engagementRows.filter((entry) => entry.event_type === "detail_view").length,
      readerOpens: engagementRows.filter((entry) => entry.event_type === "reader_open").length,
      fileAccesses: engagementRows.filter((entry) => entry.event_type === "file_access").length,
      authenticatedEvents: engagementRows.filter((entry) => Boolean(entry.user_id)).length,
      uniqueUsers: new Set(engagementRows.map((entry) => entry.user_id).filter(Boolean)).size,
    },
    engagementEvents: engagementRows.map((entry) => ({
      ...entry,
      user_name: firstOf(entry.user)?.name ?? firstOf(entry.user)?.email ?? "Visiteur anonyme",
    })),
    subscriptionMappings: (planMappingsResult.data ?? []).map((mapping) => ({
      ...mapping,
      plan_name: firstOf(mapping.plan)?.name ?? "Plan inconnu",
    })),
    editorialTimeline: [
      { label: "Cree le", value: book.created_at },
      { label: "Soumis le", value: book.submitted_at },
      { label: "Revise le", value: book.reviewed_at },
      { label: "Derniere mise a jour", value: book.updated_at },
      { label: "Publie le", value: book.published_at },
      { label: "Date de publication editoriale", value: book.publication_date },
    ],
    notices,
  };
}

export async function getAdminBookEditorOptions() {
  const supabase = await createClient();
  const { data } = await supabase.from("author_profiles").select("id, display_name").order("display_name", { ascending: true });

  return {
    authors: (data ?? []).map((author) => ({
      label: author.display_name,
      value: author.id,
    })),
  };
}
