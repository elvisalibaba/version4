import { createClient } from "@/lib/supabase/server";
import {
  ADMIN_DEFAULT_PAGE_SIZE,
  buildPagination,
  firstOf,
  getPaginationRange,
  normalizeSearchTerm,
  resolveAdminBookAuthorName,
  safeLikeTerm,
  type AdminAuthorMini,
  type AdminBookMini,
  type AdminPlanMini,
  type AdminProfileMini,
  type AdminSubscriptionMini,
  type MaybeArray,
} from "@/lib/supabase/admin/shared";
import type { AdminNotice, AdminPagedResult } from "@/types/admin";
import type { SubscriptionStatus } from "@/types/database";

type PlanBookMappingRow = {
  id: string;
  plan_id: string;
  book_id: string;
  created_at: string;
  book: MaybeArray<
    Pick<
      AdminBookMini,
      "id" | "title" | "status" | "is_subscription_available" | "is_single_sale_enabled" | "cover_url" | "price" | "currency_code"
    > & {
      author_profile: MaybeArray<Pick<AdminAuthorMini, "id" | "display_name">>;
      author_profile_fallback: MaybeArray<Pick<AdminProfileMini, "id" | "name" | "email">>;
    }
  >;
};

type UserSubscriptionRow = AdminSubscriptionMini & {
  user: MaybeArray<Pick<AdminProfileMini, "id" | "name" | "email" | "role">>;
  plan: MaybeArray<Pick<AdminPlanMini, "id" | "name" | "slug" | "monthly_price" | "currency_code" | "is_active">>;
};

export type AdminSubscriptionPlanListItem = AdminPlanMini & {
  includedBooksCount: number;
  subscribersCount: number;
};

export type AdminSubscriptionPlansPageData = AdminPagedResult<AdminSubscriptionPlanListItem> & {
  notices: AdminNotice[];
};

export type AdminSubscriptionPlanDetail = {
  plan: AdminPlanMini;
  includedBooks: Array<
    PlanBookMappingRow & {
      book_title: string;
      author_name: string;
      subscriptionWarning: string | null;
    }
  >;
  subscribers: Array<UserSubscriptionRow & { user_name: string }>;
  notices: AdminNotice[];
};

export type AdminUserSubscriptionListItem = UserSubscriptionRow & {
  user_name: string;
  plan_name: string;
};

export type AdminUserSubscriptionsPageData = AdminPagedResult<AdminUserSubscriptionListItem> & {
  notices: AdminNotice[];
};

export async function listAdminSubscriptionPlans(params: {
  page?: number;
  search?: string;
  isActive?: string;
}): Promise<AdminSubscriptionPlansPageData> {
  const supabase = await createClient();
  const page = params.page ?? 1;
  const search = normalizeSearchTerm(params.search);
  const { from, to } = getPaginationRange(page, ADMIN_DEFAULT_PAGE_SIZE);

  let query = supabase
    .from("subscription_plans")
    .select("id, name, slug, description, monthly_price, currency_code, is_active, created_at, updated_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  if (params.isActive === "true") {
    query = query.eq("is_active", true);
  } else if (params.isActive === "false") {
    query = query.eq("is_active", false);
  }

  if (search) {
    const term = safeLikeTerm(search);
    query = query.or(`name.ilike.%${term}%,slug.ilike.%${term}%,description.ilike.%${term}%`);
  }

  const { data, count, error } = await query.range(from, to).returns<AdminPlanMini[]>();

  if (error) {
    return {
      items: [],
      pagination: buildPagination(0, page, ADMIN_DEFAULT_PAGE_SIZE),
      notices: [
        {
          id: "plans-load-error",
          tone: "danger",
          title: "Impossible de charger les plans",
          description: error.message,
        },
      ],
    };
  }

  const planIds = (data ?? []).map((plan) => plan.id);
  const [mappingsResult, subscribersResult] = await Promise.all([
    planIds.length > 0 ? supabase.from("subscription_plan_books").select("plan_id").in("plan_id", planIds) : Promise.resolve({ data: [] as Array<{ plan_id: string }>, error: null }),
    planIds.length > 0 ? supabase.from("user_subscriptions").select("plan_id").in("plan_id", planIds) : Promise.resolve({ data: [] as Array<{ plan_id: string }>, error: null }),
  ]);

  const booksCountByPlanId = new Map<string, number>();
  (mappingsResult.data ?? []).forEach((row) => {
    booksCountByPlanId.set(row.plan_id, (booksCountByPlanId.get(row.plan_id) ?? 0) + 1);
  });

  const subscribersCountByPlanId = new Map<string, number>();
  (subscribersResult.data ?? []).forEach((row) => {
    subscribersCountByPlanId.set(row.plan_id, (subscribersCountByPlanId.get(row.plan_id) ?? 0) + 1);
  });

  return {
    items: (data ?? []).map((plan) => ({
      ...plan,
      includedBooksCount: booksCountByPlanId.get(plan.id) ?? 0,
      subscribersCount: subscribersCountByPlanId.get(plan.id) ?? 0,
    })),
    pagination: buildPagination(count, page, ADMIN_DEFAULT_PAGE_SIZE),
    notices: [],
  };
}

export async function getAdminSubscriptionPlanDetail(planId: string): Promise<AdminSubscriptionPlanDetail | null> {
  const supabase = await createClient();
  const planResult = await supabase
    .from("subscription_plans")
    .select("id, name, slug, description, monthly_price, currency_code, is_active, created_at, updated_at")
    .eq("id", planId)
    .returns<AdminPlanMini>()
    .maybeSingle();

  const plan = planResult.data ?? null;

  if (!plan) {
    return null;
  }

  const [includedBooksResult, subscribersResult] = await Promise.all([
    supabase
      .from("subscription_plan_books")
      .select(
        "id, plan_id, book_id, created_at, book:books!subscription_plan_books_book_id_fkey(id, title, author_display_name, status, is_subscription_available, is_single_sale_enabled, cover_url, price, currency_code, author_profile:author_profiles!books_author_profile_id_fkey(id, display_name), author_profile_fallback:profiles!books_author_id_fkey(id, name, email))",
      )
      .eq("plan_id", planId)
      .returns<PlanBookMappingRow[]>(),
    supabase
      .from("user_subscriptions")
      .select(
        "id, user_id, plan_id, status, started_at, expires_at, created_at, updated_at, user:profiles!user_subscriptions_user_id_fkey(id, name, email, role), plan:subscription_plans!user_subscriptions_plan_id_fkey(id, name, slug, monthly_price, currency_code, is_active)",
      )
      .eq("plan_id", planId)
      .order("created_at", { ascending: false })
      .returns<UserSubscriptionRow[]>(),
  ]);

  const notices: AdminNotice[] = [];
  const includedBooks = (includedBooksResult.data ?? []).map((mapping) => {
    const book = firstOf(mapping.book);
    const warning = book && !book.is_subscription_available ? "Livre inclus dans le plan mais is_subscription_available = false." : null;

    if (warning) {
      notices.push({
        id: `plan-book-warning-${mapping.id}`,
        tone: "warning",
        title: "Incoherence plan / livre",
        description: `${book?.title ?? "Livre inconnu"} est lie au plan mais n est pas marque comme disponible par abonnement.`,
      });
    }

    return {
      ...mapping,
      book_title: book?.title ?? "Livre inconnu",
      author_name: book ? resolveAdminBookAuthorName(book) : "Auteur inconnu",
      subscriptionWarning: warning,
    };
  });

  return {
    plan,
    includedBooks,
    subscribers: (subscribersResult.data ?? []).map((subscription) => ({
      ...subscription,
      user_name: firstOf(subscription.user)?.name ?? firstOf(subscription.user)?.email ?? "Utilisateur inconnu",
    })),
    notices,
  };
}

async function resolveSubscriptionFilters(search: string) {
  const supabase = await createClient();
  const term = safeLikeTerm(search);

  const [usersResult, plansResult] = await Promise.all([
    supabase.from("profiles").select("id").or(`name.ilike.%${term}%,email.ilike.%${term}%`),
    supabase.from("subscription_plans").select("id").or(`name.ilike.%${term}%,slug.ilike.%${term}%`),
  ]);

  return {
    userIds: (usersResult.data ?? []).map((row) => row.id),
    planIds: (plansResult.data ?? []).map((row) => row.id),
  };
}

export async function listAdminUserSubscriptions(params: {
  page?: number;
  search?: string;
  status?: SubscriptionStatus | "";
  planId?: string;
  userId?: string;
}): Promise<AdminUserSubscriptionsPageData> {
  const supabase = await createClient();
  const page = params.page ?? 1;
  const search = normalizeSearchTerm(params.search);
  const { from, to } = getPaginationRange(page, ADMIN_DEFAULT_PAGE_SIZE);

  let query = supabase
    .from("user_subscriptions")
    .select(
      "id, user_id, plan_id, status, started_at, expires_at, created_at, updated_at, user:profiles!user_subscriptions_user_id_fkey(id, name, email, role), plan:subscription_plans!user_subscriptions_plan_id_fkey(id, name, slug, monthly_price, currency_code, is_active)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (params.status) {
    query = query.eq("status", params.status);
  }

  if (params.planId) {
    query = query.eq("plan_id", params.planId);
  }

  if (params.userId) {
    query = query.eq("user_id", params.userId);
  }

  if (search) {
    const filter = await resolveSubscriptionFilters(search);
    if (!filter.userIds.length && !filter.planIds.length) {
      return {
        items: [],
        pagination: buildPagination(0, page, ADMIN_DEFAULT_PAGE_SIZE),
        notices: [],
      };
    }

    if (filter.userIds.length && filter.planIds.length) {
      query = query.or(`user_id.in.(${filter.userIds.join(",")}),plan_id.in.(${filter.planIds.join(",")})`);
    } else if (filter.userIds.length) {
      query = query.in("user_id", filter.userIds);
    } else {
      query = query.in("plan_id", filter.planIds);
    }
  }

  const { data, count, error } = await query.range(from, to).returns<UserSubscriptionRow[]>();

  if (error) {
    return {
      items: [],
      pagination: buildPagination(0, page, ADMIN_DEFAULT_PAGE_SIZE),
      notices: [
        {
          id: "user-subscriptions-load-error",
          tone: "danger",
          title: "Impossible de charger les abonnements utilisateurs",
          description: error.message,
        },
      ],
    };
  }

  return {
    items: (data ?? []).map((subscription) => ({
      ...subscription,
      user_name: firstOf(subscription.user)?.name ?? firstOf(subscription.user)?.email ?? "Utilisateur inconnu",
      plan_name: firstOf(subscription.plan)?.name ?? "Plan inconnu",
    })),
    pagination: buildPagination(count, page, ADMIN_DEFAULT_PAGE_SIZE),
    notices: [],
  };
}

export async function getAdminSubscriptionEditorOptions() {
  const supabase = await createClient();
  const [plansResult, usersResult, booksResult] = await Promise.all([
    supabase.from("subscription_plans").select("id, name, slug").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, name, email").order("created_at", { ascending: false }),
    supabase
      .from("books")
      .select(
        "id, title, author_display_name, status, is_subscription_available, author_profile:author_profiles!books_author_profile_id_fkey(display_name), author_profile_fallback:profiles!books_author_id_fkey(name, email)",
      )
      .order("created_at", { ascending: false }),
  ]);

  return {
    plans: (plansResult.data ?? []).map((plan) => ({
      value: plan.id,
      label: `${plan.name} (${plan.slug})`,
    })),
    users: (usersResult.data ?? []).map((user) => ({
      value: user.id,
      label: `${user.name ?? "Sans nom"} - ${user.email}`,
    })),
    books: (booksResult.data ?? []).map((book) => ({
      value: book.id,
      label: `${book.title} - ${resolveAdminBookAuthorName(book)}`,
    })),
  };
}
