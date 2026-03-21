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
      "id, user_id, book_id, purchased_at, access_type, subscription_id, user:profiles!library_user_id_fkey(id, name, email, role), book:books!library_book_id_fkey(id, title, status, author_id), subscription:user_subscriptions!library_subscription_id_fkey(id, status, expires_at, plan:subscription_plans!user_subscriptions_plan_id_fkey(id, name, slug))",
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

  return {
    items: (data ?? []).map((row) => ({
      ...row,
      user_name: firstOf(row.user)?.name ?? firstOf(row.user)?.email ?? "Utilisateur inconnu",
      book_title: firstOf(row.book)?.title ?? "Livre inconnu",
      plan_name: firstOf(firstOf(row.subscription)?.plan)?.name ?? null,
    })),
    pagination: buildPagination(count, page, ADMIN_DEFAULT_PAGE_SIZE),
    notices,
  };
}

export async function getAdminLibraryEditorOptions() {
  const supabase = await createClient();
  const [usersResult, booksResult, subscriptionsResult] = await Promise.all([
    supabase.from("profiles").select("id, name, email").order("created_at", { ascending: false }),
    supabase.from("books").select("id, title").order("created_at", { ascending: false }),
    supabase
      .from("user_subscriptions")
      .select("id, user_id, status, plan:subscription_plans!user_subscriptions_plan_id_fkey(name)")
      .order("created_at", { ascending: false }),
  ]);

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
      label: `${firstOf(subscription.plan)?.name ?? "Plan"} - ${subscription.status} - ${subscription.user_id.slice(0, 8)}`,
    })),
  };
}
