import { createClient } from "@/lib/supabase/server";
import {
  ADMIN_DEFAULT_PAGE_SIZE,
  buildPagination,
  firstOf,
  getPaginationRange,
  normalizeSearchTerm,
  safeLikeTerm,
  type AdminBookMini,
  type AdminProfileMini,
  type MaybeArray,
} from "@/lib/supabase/admin/shared";
import type { AdminChartDatum, AdminNotice, AdminPagedResult } from "@/types/admin";

type RatingRow = {
  id: string;
  user_id: string;
  book_id: string;
  rating: number;
  created_at: string;
  updated_at: string;
  user: MaybeArray<Pick<AdminProfileMini, "id" | "name" | "email" | "role">>;
  book: MaybeArray<Pick<AdminBookMini, "id" | "title" | "status">>;
};

type RatingStatsRow = {
  id: string;
  user_id: string;
  book_id: string;
  rating: number;
  book: MaybeArray<Pick<AdminBookMini, "id" | "title" | "status">>;
};

export type AdminRatingListItem = RatingRow & {
  user_name: string;
  book_title: string;
};

export type AdminRatingsPageData = AdminPagedResult<AdminRatingListItem> & {
  stats: {
    distribution: AdminChartDatum[];
    averageGlobal: number | null;
    averageByBook: AdminChartDatum[];
  };
  notices: AdminNotice[];
};

async function resolveRatingsSearch(search: string) {
  const supabase = await createClient();
  const term = safeLikeTerm(search);
  const [usersResult, booksResult] = await Promise.all([
    supabase.from("profiles").select("id").or(`name.ilike.%${term}%,email.ilike.%${term}%`),
    supabase.from("books").select("id").or(`title.ilike.%${term}%,subtitle.ilike.%${term}%`),
  ]);

  return {
    userIds: (usersResult.data ?? []).map((row) => row.id),
    bookIds: (booksResult.data ?? []).map((row) => row.id),
  };
}

function applyRatingsFilters(
  query: ReturnType<Awaited<ReturnType<typeof createClient>>["from"]>["select"],
  params: { rating?: string; userId?: string; bookId?: string },
) {
  let next = query;

  if (params.rating) {
    next = next.eq("rating", Number(params.rating));
  }

  if (params.userId) {
    next = next.eq("user_id", params.userId);
  }

  if (params.bookId) {
    next = next.eq("book_id", params.bookId);
  }

  return next;
}

export async function listAdminRatings(params: {
  page?: number;
  search?: string;
  rating?: string;
  userId?: string;
  bookId?: string;
}): Promise<AdminRatingsPageData> {
  const supabase = await createClient();
  const page = params.page ?? 1;
  const search = normalizeSearchTerm(params.search);
  const { from, to } = getPaginationRange(page, ADMIN_DEFAULT_PAGE_SIZE);

  let listQuery = applyRatingsFilters(
    supabase
      .from("ratings")
      .select("id, user_id, book_id, rating, created_at, updated_at, user:profiles!ratings_user_id_fkey(id, name, email, role), book:books!ratings_book_id_fkey(id, title, status)", {
        count: "exact",
      })
      .order("created_at", { ascending: false }),
    params,
  );

  let statsQuery = applyRatingsFilters(
    supabase
      .from("ratings")
      .select("id, user_id, book_id, rating, book:books!ratings_book_id_fkey(id, title, status)")
      .order("created_at", { ascending: false }),
    params,
  );

  if (search) {
    const filter = await resolveRatingsSearch(search);
    if (!filter.userIds.length && !filter.bookIds.length) {
      return {
        items: [],
        pagination: buildPagination(0, page, ADMIN_DEFAULT_PAGE_SIZE),
        stats: {
          distribution: [],
          averageGlobal: null,
          averageByBook: [],
        },
        notices: [
          {
            id: "ratings-search-empty",
            tone: "info",
            title: "Aucun resultat",
            description: "Aucun utilisateur ou livre correspondant n a ete trouve pour ce filtre.",
          },
        ],
      };
    }

    if (filter.userIds.length && filter.bookIds.length) {
      listQuery = listQuery.or(`user_id.in.(${filter.userIds.join(",")}),book_id.in.(${filter.bookIds.join(",")})`);
      statsQuery = statsQuery.or(`user_id.in.(${filter.userIds.join(",")}),book_id.in.(${filter.bookIds.join(",")})`);
    } else if (filter.userIds.length) {
      listQuery = listQuery.in("user_id", filter.userIds);
      statsQuery = statsQuery.in("user_id", filter.userIds);
    } else {
      listQuery = listQuery.in("book_id", filter.bookIds);
      statsQuery = statsQuery.in("book_id", filter.bookIds);
    }
  }

  const [listResult, statsResult] = await Promise.all([listQuery.range(from, to), statsQuery]);

  if (listResult.error) {
    return {
      items: [],
      pagination: buildPagination(0, page, ADMIN_DEFAULT_PAGE_SIZE),
      stats: {
        distribution: [],
        averageGlobal: null,
        averageByBook: [],
      },
      notices: [
        {
          id: "ratings-load-error",
          tone: "danger",
          title: "Impossible de charger les notes",
          description: listResult.error.message,
        },
      ],
    };
  }

  const listRows = (listResult.data ?? []) as RatingRow[];
  const statsRows = (statsResult.data ?? []) as RatingStatsRow[];
  const distribution = [1, 2, 3, 4, 5].map((value) => ({
    label: `${value} etoile${value > 1 ? "s" : ""}`,
    value: statsRows.filter((row: RatingStatsRow) => Math.round(Number(row.rating)) === value).length,
  }));
  const averageGlobal =
    statsRows.length > 0
      ? Number((statsRows.reduce((total: number, row: RatingStatsRow) => total + Number(row.rating ?? 0), 0) / statsRows.length).toFixed(1))
      : null;

  const averageByBookMap = new Map<string, { label: string; total: number; count: number }>();
  statsRows.forEach((row: RatingStatsRow) => {
    const label = firstOf(row.book)?.title ?? "Livre inconnu";
    const current = averageByBookMap.get(row.book_id) ?? { label, total: 0, count: 0 };
    current.total += Number(row.rating ?? 0);
    current.count += 1;
    averageByBookMap.set(row.book_id, current);
  });

  return {
    items: listRows.map((row: RatingRow) => ({
      ...row,
      user_name: firstOf(row.user)?.name ?? firstOf(row.user)?.email ?? "Utilisateur inconnu",
      book_title: firstOf(row.book)?.title ?? "Livre inconnu",
    })),
    pagination: buildPagination(listResult.count, page, ADMIN_DEFAULT_PAGE_SIZE),
    stats: {
      distribution,
      averageGlobal,
      averageByBook: Array.from(averageByBookMap.values())
        .map((entry) => ({
          label: entry.label,
          value: Number((entry.total / entry.count).toFixed(1)),
          suffix: "/5",
        }))
        .sort((left, right) => right.value - left.value)
        .slice(0, 6),
    },
    notices: [
      {
        id: "ratings-sync",
        tone: "warning",
        title: "Recalcul books.rating_avg / ratings_count",
        description:
          "Si une note est supprimee pour moderation, il faut prevoir le recalcul ou la resynchronisation visuelle des compteurs du livre associe.",
      },
    ],
  };
}
