import { createClient } from "@/lib/supabase/server";
import {
  ADMIN_DEFAULT_PAGE_SIZE,
  buildPagination,
  firstOf,
  getPaginationRange,
  normalizeSearchTerm,
  safeLikeTerm,
  type AdminBookMini,
  type AdminPlanMini,
  type AdminProfileMini,
  type MaybeArray,
} from "@/lib/supabase/admin/shared";
import type { AdminNotice, AdminPagedResult } from "@/types/admin";
import type { LibraryAccessType, SubscriptionStatus } from "@/types/database";

type LibraryRow = {
  id: string;
  user_id: string;
  book_id: string;
  purchased_at: string;
  access_type: "purchase" | "subscription" | "free";
  subscription_id: string | null;
  user: MaybeArray<Pick<AdminProfileMini, "id" | "name" | "email" | "role">>;
  book: MaybeArray<Pick<AdminBookMini, "id" | "title" | "status" | "author_id">>;
  subscription: MaybeArray<{
    id: string;
    status: SubscriptionStatus;
    expires_at: string | null;
    plan: MaybeArray<Pick<AdminPlanMini, "id" | "name" | "slug">>;
  }>;
};

export type AdminLibraryListItem = LibraryRow & {
  user_name: string;
  book_title: string;
  plan_name: string | null;
};

export type AdminLibraryPageData = AdminPagedResult<AdminLibraryListItem> & {
  notices: AdminNotice[];
};

async function resolveLibrarySearchFilter(search: string) {
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

export async function listAdminLibrary(params: {
  page?: number;
  search?: string;
  accessType?: string;
  userId?: string;
  bookId?: string;
}): Promise<AdminLibraryPageData> {
  const supabase = await createClient();
  const page = params.page ?? 1;
  const search = normalizeSearchTerm(params.search);
  const { from, to } = getPaginationRange(page, ADMIN_DEFAULT_PAGE_SIZE);
  const notices: AdminNotice[] = [];

  let query = supabase
    .from("library")
    .select(
      "id, user_id, book_id, purchased_at, access_type, subscription_id",
      { count: "exact" },
    )
    .order("purchased_at", { ascending: false });

  if (params.accessType) {
    query = query.eq("access_type", params.accessType as LibraryAccessType);
  }

  if (params.userId) {
    query = query.eq("user_id", params.userId);
  }

  if (params.bookId) {
    query = query.eq("book_id", params.bookId);
  }

  if (search) {
    const filter = await resolveLibrarySearchFilter(search);
    if (!filter.userIds.length && !filter.bookIds.length) {
      return {
        items: [],
        pagination: buildPagination(0, page, ADMIN_DEFAULT_PAGE_SIZE),
        notices,
      };
    }

    if (filter.userIds.length && filter.bookIds.length) {
      query = query.or(
        `user_id.in.(${filter.userIds.join(",")}),book_id.in.(${filter.bookIds.join(",")})`,
      );
    } else if (filter.userIds.length) {
      query = query.in("user_id", filter.userIds);
    } else if (filter.bookIds.length) {
      query = query.in("book_id", filter.bookIds);
    }
  }

  const { data, count, error } = await query.range(from, to).returns<LibraryRow[]>();

  if (error) {
    return {
      items: [],
      pagination: buildPagination(0, page, ADMIN_DEFAULT_PAGE_SIZE),
      notices: [
        {
          id: "library-load-error",
          tone: "danger",
          title: "Impossible de charger la bibliotheque",
          description: error.message,
        },
      ],
    };
  }

  const rows = data ?? [];
  const userIds = Array.from(new Set(rows.map((row) => row.user_id)));
  const bookIds = Array.from(new Set(rows.map((row) => row.book_id)));
  const subscriptionIds = Array.from(new Set(rows.map((row) => row.subscription_id).filter((id): id is string => Boolean(id))));
  const [usersResult, booksResult, subscriptionsResult] = await Promise.all([
    userIds.length ? supabase.from("profiles").select("id, name, email, role").in("id", userIds) : Promise.resolve({ data: [] }),
    bookIds.length ? supabase.from("books").select("id, title, status, author_id").in("id", bookIds) : Promise.resolve({ data: [] }),
    subscriptionIds.length ? supabase.from("user_subscriptions").select("id, status, expires_at, plan_id").in("id", subscriptionIds) : Promise.resolve({ data: [] }),
  ]);
  const planIds = Array.from(new Set((subscriptionsResult.data ?? []).map((subscription) => subscription.plan_id)));
  const plansResult = planIds.length ? await supabase.from("subscription_plans").select("id, name, slug").in("id", planIds) : { data: [] };
  const users = new Map((usersResult.data ?? []).map((user) => [user.id, user]));
  const books = new Map((booksResult.data ?? []).map((book) => [book.id, book]));
  const plans = new Map((plansResult.data ?? []).map((plan) => [plan.id, plan]));
  const subscriptions = new Map((subscriptionsResult.data ?? []).map((subscription) => [subscription.id, { ...subscription, plan: plans.get(subscription.plan_id) ?? null }]));

  return {
    items: rows.map((row) => {
      const user = users.get(row.user_id);
      const book = books.get(row.book_id);
      const subscription = row.subscription_id ? subscriptions.get(row.subscription_id) : null;
      const hydratedRow: LibraryRow = { ...row, user: user ?? null, book: book ?? null, subscription: subscription ?? null };
      return {
        ...hydratedRow,
        user_name: user?.name ?? user?.email ?? "Utilisateur inconnu",
        book_title: book?.title ?? "Livre inconnu",
        plan_name: firstOf(subscription?.plan)?.name ?? null,
      };
    }),
    pagination: buildPagination(count, page, ADMIN_DEFAULT_PAGE_SIZE),
    notices,
  };
}

export async function getAdminLibraryEditorOptions() {
  const supabase = await createClient();
  const [usersResult, booksResult, subscriptionsResult] = await Promise.all([
    supabase.from("profiles").select("id, name, email").order("created_at", { ascending: false }),
    supabase.from("books").select("id, title").order("created_at", { ascending: false }),
    supabase.from("user_subscriptions").select("id, user_id, status, plan_id").order("created_at", { ascending: false }),
  ]);

  const planIds = Array.from(new Set((subscriptionsResult.data ?? []).map((subscription) => subscription.plan_id)));
  const plansResult = planIds.length ? await supabase.from("subscription_plans").select("id, name").in("id", planIds) : { data: [] };
  const plans = new Map((plansResult.data ?? []).map((plan) => [plan.id, plan.name]));

  return {
    users: (usersResult.data ?? []).map((user) => ({
      value: user.id,
      label: `${user.name ?? "Sans nom"} - ${user.email}`,
    })),
    books: (booksResult.data ?? []).map((book) => ({
      value: book.id,
      label: book.title,
    })),
    subscriptions: (subscriptionsResult.data ?? []).map((subscription) => ({
      value: subscription.id,
      label: `${plans.get(subscription.plan_id) ?? "Plan"} - ${subscription.status} - ${subscription.user_id.slice(0, 8)}`,
    })),
  };
}
