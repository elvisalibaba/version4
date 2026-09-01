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

type HighlightRow = {
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
  book: MaybeArray<Pick<AdminBookMini, "id" | "title" | "status">>;
};

type HighlightStatsRow = {
  id: string;
  book_id: string;
  color: string;
  book: MaybeArray<Pick<AdminBookMini, "id" | "title" | "status">>;
};

export type AdminHighlightListItem = HighlightRow & {
  user_name: string;
  book_title: string;
};

export type AdminHighlightsPageData = AdminPagedResult<AdminHighlightListItem> & {
  stats: {
    byColor: AdminChartDatum[];
    topBooks: AdminChartDatum[];
  };
  notices: AdminNotice[];
};

async function resolveHighlightSearch(search: string) {
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

function applyHighlightFilters(
  query: ReturnType<Awaited<ReturnType<typeof createClient>>["from"]>["select"],
  params: { color?: string; userId?: string; bookId?: string },
) {
  let next = query;

  if (params.color) {
    next = next.eq("color", params.color);
  }

  if (params.userId) {
    next = next.eq("user_id", params.userId);
  }

  if (params.bookId) {
    next = next.eq("book_id", params.bookId);
  }

  return next;
}

export async function listAdminHighlights(params: {
  page?: number;
  search?: string;
  color?: string;
  userId?: string;
  bookId?: string;
}): Promise<AdminHighlightsPageData> {
  const supabase = await createClient();
  const page = params.page ?? 1;
  const search = normalizeSearchTerm(params.search);
  const { from, to } = getPaginationRange(page, ADMIN_DEFAULT_PAGE_SIZE);

  let listQuery = applyHighlightFilters(
    supabase
      .from("highlights")
      .select(
        "id, user_id, book_id, page, text, note, color, created_at, updated_at",
        { count: "exact" },
      )
      .order("created_at", { ascending: false }),
    params,
  );

  let statsQuery = applyHighlightFilters(
    supabase
      .from("highlights")
      .select("id, book_id, color")
      .order("created_at", { ascending: false }),
    params,
  );

  if (search) {
    const filter = await resolveHighlightSearch(search);
    if (!filter.userIds.length && !filter.bookIds.length) {
      return {
        items: [],
        pagination: buildPagination(0, page, ADMIN_DEFAULT_PAGE_SIZE),
        stats: {
          byColor: [],
          topBooks: [],
        },
        notices: [
          {
            id: "highlights-search-empty",
            tone: "info",
            title: "Aucun resultat",
            description: "Aucun utilisateur ou livre ne correspond a ce filtre.",
          },
        ],
      };
    }

    if (filter.userIds.length && filter.bookIds.length) {
      listQuery = listQuery.or(`user_id.in.(${filter.userIds.join(",")}),book_id.in.(${filter.bookIds.join(",")})`);
      statsQuery = statsQuery.in("book_id", filter.bookIds);
    } else if (filter.userIds.length) {
      listQuery = listQuery.in("user_id", filter.userIds);
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
        byColor: [],
        topBooks: [],
      },
      notices: [
        {
          id: "highlights-load-error",
          tone: "danger",
          title: "Impossible de charger les highlights",
          description: listResult.error.message,
        },
      ],
    };
  }

  const rawListRows = (listResult.data ?? []) as Array<Omit<HighlightRow, "user" | "book">>;
  const rawStatsRows = (statsResult.data ?? []) as Array<Omit<HighlightStatsRow, "book">>;
  const userIds = Array.from(new Set(rawListRows.map((row) => row.user_id)));
  const bookIds = Array.from(new Set([...rawListRows.map((row) => row.book_id), ...rawStatsRows.map((row) => row.book_id)]));
  const [usersResult, booksResult] = await Promise.all([
    userIds.length ? supabase.from("profiles").select("id, name, email, role").in("id", userIds) : Promise.resolve({ data: [] }),
    bookIds.length ? supabase.from("books").select("id, title, status").in("id", bookIds) : Promise.resolve({ data: [] }),
  ]);
  const users = new Map((usersResult.data ?? []).map((user) => [user.id, user]));
  const books = new Map((booksResult.data ?? []).map((book) => [book.id, book]));
  const listRows: HighlightRow[] = rawListRows.map((row) => ({ ...row, user: users.get(row.user_id) ?? null, book: books.get(row.book_id) ?? null }));
  const statsRows: HighlightStatsRow[] = rawStatsRows.map((row) => ({ ...row, book: books.get(row.book_id) ?? null }));
  const byColorMap = new Map<string, number>();
  const byBookMap = new Map<string, { label: string; value: number }>();

  statsRows.forEach((row: HighlightStatsRow) => {
    byColorMap.set(row.color, (byColorMap.get(row.color) ?? 0) + 1);
    const current = byBookMap.get(row.book_id) ?? { label: firstOf(row.book)?.title ?? "Livre inconnu", value: 0 };
    current.value += 1;
    byBookMap.set(row.book_id, current);
  });

  return {
    items: listRows.map((row: HighlightRow) => ({
      ...row,
      user_name: firstOf(row.user)?.name ?? firstOf(row.user)?.email ?? "Utilisateur inconnu",
      book_title: firstOf(row.book)?.title ?? "Livre inconnu",
    })),
    pagination: buildPagination(listResult.count, page, ADMIN_DEFAULT_PAGE_SIZE),
    stats: {
      byColor: Array.from(byColorMap.entries()).map(([label, value]) => ({ label, value })),
      topBooks: Array.from(byBookMap.values()).sort((left, right) => right.value - left.value).slice(0, 6),
    },
    notices: [
      {
        id: "highlight-moderation",
        tone: "warning",
        title: "Respect des notes personnelles",
        description: "Une annotation ne doit être supprimée que si son contenu nécessite réellement une intervention.",
      },
    ],
  };
}
