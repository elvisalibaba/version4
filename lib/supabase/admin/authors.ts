import { createClient } from "@/lib/supabase/server";
import {
  ADMIN_DEFAULT_PAGE_SIZE,
  buildPagination,
  firstOf,
  getPaginationRange,
  normalizeSearchTerm,
  safeLikeTerm,
  type AdminAuthorMini,
  type AdminBookMini,
  type AdminClient,
  type AdminPlanMini,
  type AdminProfileMini,
  type MaybeArray,
} from "@/lib/supabase/admin/shared";
import type { AdminNotice, AdminPagedResult } from "@/types/admin";
import type { BookFormatType } from "@/types/database";

type AuthorProfileRow = AdminAuthorMini & {
  professional_headline: string | null;
  phone: string | null;
  genres: string[];
  publishing_goals: string | null;
  profile: MaybeArray<Pick<AdminProfileMini, "id" | "email" | "name" | "role" | "created_at">>;
};

type AuthorBookRow = AdminBookMini & {
  author_profile: MaybeArray<Pick<AdminAuthorMini, "id" | "display_name">>;
};

type AuthorFormatRow = {
  id: string;
  book_id: string;
  format: BookFormatType;
  price: number;
  currency_code: string;
  downloadable: boolean;
  is_published: boolean;
  stock_quantity: number | null;
  file_url: string | null;
  created_at: string;
};

type AuthorPlanRow = {
  id: string;
  plan_id: string;
  book_id: string;
  created_at: string;
  plan: MaybeArray<Pick<AdminPlanMini, "id" | "name" | "slug" | "is_active">>;
};

export type AdminAuthorListItem = {
  id: string;
  displayName: string;
  email: string;
  location: string | null;
  website: string | null;
  bio: string | null;
  booksCount: number;
  totalViews: number;
  totalPurchases: number;
  averageRating: number | null;
  estimatedSales: number;
};

export type AdminAuthorsPageData = AdminPagedResult<AdminAuthorListItem> & {
  notices: AdminNotice[];
};

export type AdminAuthorDetail = {
  profile: AuthorProfileRow;
  metrics: {
    booksCount: number;
    totalViews: number;
    totalPurchases: number;
    averageRating: number | null;
    estimatedSales: number;
  };
  books: Array<
    AuthorBookRow & {
      formatCount: number;
      orderCount: number;
      includedPlanCount: number;
      availableFormats: BookFormatType[];
    }
  >;
  formats: AuthorFormatRow[];
  subscriptionMappings: Array<AuthorPlanRow & { plan_name: string; book_title: string }>;
  notices: AdminNotice[];
};

function computeAuthorStats(books: AuthorBookRow[]) {
  const totalViews = books.reduce((total, book) => total + Number(book.views_count ?? 0), 0);
  const totalPurchases = books.reduce((total, book) => total + Number(book.purchases_count ?? 0), 0);
  const estimatedSales = books.reduce(
    (total, book) => total + Number(book.purchases_count ?? 0) * Number(book.price ?? 0),
    0,
  );
  const totalRatingsWeight = books.reduce((total, book) => total + Number(book.ratings_count ?? 0), 0);
  const weightedRatings = books.reduce(
    (total, book) => total + Number(book.rating_avg ?? 0) * Number(book.ratings_count ?? 0),
    0,
  );

  return {
    booksCount: books.length,
    totalViews,
    totalPurchases,
    estimatedSales,
    averageRating: totalRatingsWeight > 0 ? Number((weightedRatings / totalRatingsWeight).toFixed(1)) : null,
  };
}

async function resolveAuthorIdsBySearch(client: AdminClient, search: string) {
  if (!search) return null;

  const term = safeLikeTerm(search);
  const [authorMatches, profileMatches] = await Promise.all([
    client
      .from("author_profiles")
      .select("id")
      .or(`display_name.ilike.%${term}%,bio.ilike.%${term}%,location.ilike.%${term}%,website.ilike.%${term}%,professional_headline.ilike.%${term}%,publishing_goals.ilike.%${term}%`),
    client.from("profiles").select("id").or(`name.ilike.%${term}%,email.ilike.%${term}%`),
  ]);

  const ids = new Set<string>();
  (authorMatches.data ?? []).forEach((item) => ids.add(item.id));
  (profileMatches.data ?? []).forEach((item) => ids.add(item.id));

  return Array.from(ids);
}

export async function listAdminAuthors(params: {
  page?: number;
  search?: string;
}): Promise<AdminAuthorsPageData> {
  const supabase = await createClient();
  const page = params.page ?? 1;
  const search = normalizeSearchTerm(params.search);
  const notices: AdminNotice[] = [];
  const { from, to } = getPaginationRange(page, ADMIN_DEFAULT_PAGE_SIZE);

  const searchIds = await resolveAuthorIdsBySearch(supabase, search);

  let query = supabase
    .from("author_profiles")
    .select("id, display_name, avatar_url, bio, website, location, professional_headline, phone, genres, publishing_goals, profile:profiles!author_profiles_id_fkey(id, email, name, role, created_at)", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  if (search) {
    if (!searchIds?.length) {
      return {
        items: [],
        pagination: buildPagination(0, page, ADMIN_DEFAULT_PAGE_SIZE),
        notices,
      };
    }

    query = query.in("id", searchIds);
  }

  const { data, count, error } = await query.range(from, to).returns<AuthorProfileRow[]>();

  if (error) {
    return {
      items: [],
      pagination: buildPagination(0, page, ADMIN_DEFAULT_PAGE_SIZE),
      notices: [
        {
          id: "authors-load-error",
          tone: "danger",
          title: "Impossible de charger les auteurs",
          description: error.message,
        },
      ],
    };
  }

  const authors = data ?? [];
  const authorIds = authors.map((author) => author.id);

  const booksResult =
    authorIds.length > 0
      ? await supabase
          .from("books")
          .select(
            "id, title, subtitle, author_display_name, status, cover_url, price, currency_code, views_count, purchases_count, rating_avg, ratings_count, publication_date, published_at, created_at, language, categories, is_single_sale_enabled, is_subscription_available, author_profile:author_profiles!books_author_profile_id_fkey(id, display_name)",
          )
          .in("author_id", authorIds)
          .returns<AuthorBookRow[]>()
      : { data: [] as AuthorBookRow[], error: null };

  const booksByAuthorId = new Map<string, AuthorBookRow[]>();
  (booksResult.data ?? []).forEach((book) => {
    const authorId = firstOf(book.author_profile)?.id;
    if (!authorId) return;
    const current = booksByAuthorId.get(authorId) ?? [];
    current.push(book);
    booksByAuthorId.set(authorId, current);
  });

  return {
    items: authors.map((author) => {
      const authorBooks = booksByAuthorId.get(author.id) ?? [];
      const stats = computeAuthorStats(authorBooks);

      return {
        id: author.id,
        displayName: author.display_name,
        email: firstOf(author.profile)?.email ?? "",
        location: author.location,
        website: author.website,
        bio: author.bio,
        booksCount: stats.booksCount,
        totalViews: stats.totalViews,
        totalPurchases: stats.totalPurchases,
        averageRating: stats.averageRating,
        estimatedSales: stats.estimatedSales,
      };
    }),
    pagination: buildPagination(count, page, ADMIN_DEFAULT_PAGE_SIZE),
    notices,
  };
}

export async function getAdminAuthorDetail(authorId: string): Promise<AdminAuthorDetail | null> {
  const supabase = await createClient();
  const notices: AdminNotice[] = [];

  const [authorResult, booksResult] = await Promise.all([
    supabase
      .from("author_profiles")
      .select("id, display_name, avatar_url, bio, website, location, professional_headline, phone, genres, publishing_goals, profile:profiles!author_profiles_id_fkey(id, email, name, role, created_at)")
      .eq("id", authorId)
      .returns<AuthorProfileRow>()
      .maybeSingle(),
    supabase
      .from("books")
      .select(
        "id, title, subtitle, author_display_name, status, cover_url, price, currency_code, views_count, purchases_count, rating_avg, ratings_count, publication_date, published_at, created_at, language, categories, is_single_sale_enabled, is_subscription_available, author_profile:author_profiles!books_author_profile_id_fkey(id, display_name)",
      )
      .eq("author_id", authorId)
      .order("created_at", { ascending: false })
      .returns<AuthorBookRow[]>(),
  ]);

  const author = authorResult.data ?? null;

  if (!author) {
    return null;
  }

  const books = booksResult.data ?? [];
  const bookIds = books.map((book) => book.id);

  const [formatsResult, orderItemsResult, planMappingsResult] = await Promise.all([
    bookIds.length > 0
      ? supabase
          .from("book_formats")
          .select("id, book_id, format, price, currency_code, downloadable, is_published, stock_quantity, file_url, created_at")
          .in("book_id", bookIds)
          .returns<AuthorFormatRow[]>()
      : Promise.resolve({ data: [] as AuthorFormatRow[], error: null }),
    bookIds.length > 0
      ? supabase.from("order_items").select("id, order_id, book_id").in("book_id", bookIds)
      : Promise.resolve({ data: [] as Array<{ id: string; order_id: string; book_id: string }>, error: null }),
    bookIds.length > 0
      ? supabase
          .from("subscription_plan_books")
          .select("id, plan_id, book_id, created_at, plan:subscription_plans(id, name, slug, is_active)")
          .in("book_id", bookIds)
          .returns<AuthorPlanRow[]>()
      : Promise.resolve({ data: [] as AuthorPlanRow[], error: null }),
  ]);

  const formatsByBookId = new Map<string, AuthorFormatRow[]>();
  (formatsResult.data ?? []).forEach((format) => {
    const current = formatsByBookId.get(format.book_id) ?? [];
    current.push(format);
    formatsByBookId.set(format.book_id, current);
  });

  const orderCountByBookId = new Map<string, number>();
  (orderItemsResult.data ?? []).forEach((item) => {
    orderCountByBookId.set(item.book_id, (orderCountByBookId.get(item.book_id) ?? 0) + 1);
  });

  const planMappingsByBookId = new Map<string, AuthorPlanRow[]>();
  (planMappingsResult.data ?? []).forEach((mapping) => {
    const current = planMappingsByBookId.get(mapping.book_id) ?? [];
    current.push(mapping);
    planMappingsByBookId.set(mapping.book_id, current);
  });

  const stats = computeAuthorStats(books);

  return {
    profile: author,
    metrics: stats,
    books: books.map((book) => ({
      ...book,
      formatCount: (formatsByBookId.get(book.id) ?? []).length,
      orderCount: orderCountByBookId.get(book.id) ?? 0,
      includedPlanCount: (planMappingsByBookId.get(book.id) ?? []).length,
      availableFormats: (formatsByBookId.get(book.id) ?? []).map((format) => format.format),
    })),
    formats: formatsResult.data ?? [],
    subscriptionMappings: (planMappingsResult.data ?? []).map((mapping) => ({
      ...mapping,
      plan_name: firstOf(mapping.plan)?.name ?? "Plan inconnu",
      book_title: books.find((book) => book.id === mapping.book_id)?.title ?? "Livre inconnu",
    })),
    notices,
  };
}
