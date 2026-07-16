import { createClient } from "@/lib/supabase/server";
import {
  ADMIN_DEFAULT_PAGE_SIZE,
  buildPagination,
  firstOf,
  getPaginationRange,
  isSubscriptionActive,
  normalizeSearchTerm,
  safeLikeTerm,
  type AdminPlanMini,
  type AdminProfileMini,
  type MaybeArray,
} from "@/lib/supabase/admin/shared";
import type { AdminNotice, AdminPagedResult } from "@/types/admin";
import type { BookEngagementEventType, Database, SubscriptionStatus, UserRole } from "@/types/database";

type AdminUserProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  | "id"
  | "email"
  | "name"
  | "role"
  | "created_at"
  | "first_name"
  | "last_name"
  | "phone"
  | "country"
  | "city"
  | "preferred_language"
  | "favorite_categories"
  | "marketing_opt_in"
>;

type UserAuthorProfileRow = Pick<
  Database["public"]["Tables"]["author_profiles"]["Row"],
  | "id"
  | "display_name"
  | "avatar_url"
  | "location"
  | "website"
  | "bio"
  | "professional_headline"
  | "phone"
  | "genres"
  | "publishing_goals"
>;

type UserSubscriptionRow = {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  started_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  plan: MaybeArray<Pick<AdminPlanMini, "id" | "name" | "slug" | "monthly_price" | "currency_code" | "is_active">>;
};

type UserLibraryRow = {
  id: string;
  user_id: string;
  book_id: string;
  purchased_at: string;
  access_type: "purchase" | "subscription" | "free";
  subscription_id: string | null;
  book: MaybeArray<{
    id: string;
    title: string;
    status: string;
    cover_url: string | null;
  }>;
};

type UserRatingRow = {
  id: string;
  user_id: string;
  book_id: string;
  rating: number;
  created_at: string;
  updated_at: string;
  book: MaybeArray<{ id: string; title: string; status: string }>;
};

type UserHighlightRow = {
  id: string;
  user_id: string;
  book_id: string;
  page: number;
  text: string | null;
  note: string | null;
  color: string;
  created_at: string;
  updated_at: string;
  book: MaybeArray<{ id: string; title: string; status: string }>;
};

type UserOrderRow = {
  id: string;
  user_id: string;
  total_price: number;
  currency_code: string;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  created_at: string;
};

type UserOrderItemRow = {
  id: string;
  order_id: string;
  book_id: string;
  price: number;
  currency_code: string;
  book: MaybeArray<{ id: string; title: string; status: string }>;
};

type UserEngagementRow = {
  id: string;
  user_id: string | null;
  book_id: string;
  event_type: BookEngagementEventType;
  source: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
  book: MaybeArray<{ id: string; title: string; status: string }>;
};

export type AdminUserListItem = AdminProfileMini & {
  libraryCount: number;
  orderCount: number;
  ratingsCount: number;
  highlightsCount: number;
  activeSubscription:
    | {
        id: string;
        status: SubscriptionStatus;
        planName: string;
        expiresAt: string | null;
      }
    | null;
};

export type AdminUsersPageData = AdminPagedResult<AdminUserListItem> & {
  notices: AdminNotice[];
};

export type AdminUserDetail = {
  profile: AdminUserProfileRow;
  authorProfile: UserAuthorProfileRow | null;
  metrics: {
    libraryCount: number;
    orderCount: number;
    ratingsCount: number;
    highlightsCount: number;
    detailViews: number;
    readerOpenCount: number;
    fileAccessCount: number;
  };
  orders: Array<UserOrderRow & { items: Array<UserOrderItemRow & { book_title: string }> }>;
  library: Array<UserLibraryRow & { book_title: string }>;
  subscriptions: Array<UserSubscriptionRow & { plan_name: string }>;
  ratings: Array<UserRatingRow & { book_title: string }>;
  highlights: Array<UserHighlightRow & { book_title: string }>;
  engagements: Array<UserEngagementRow & { book_title: string }>;
  notices: AdminNotice[];
};

function getActiveSubscription(subscriptions: UserSubscriptionRow[]) {
  return (
    subscriptions
      .filter((subscription) => isSubscriptionActive(subscription))
      .sort((left, right) => {
        const leftDate = left.expires_at ? new Date(left.expires_at).getTime() : Number.MAX_SAFE_INTEGER;
        const rightDate = right.expires_at ? new Date(right.expires_at).getTime() : Number.MAX_SAFE_INTEGER;
        return rightDate - leftDate;
      })[0] ?? null
  );
}

export async function listAdminUsers(params: {
  page?: number;
  search?: string;
  role?: UserRole | "";
}): Promise<AdminUsersPageData> {
  const supabase = await createClient();
  const page = params.page ?? 1;
  const search = normalizeSearchTerm(params.search);
  const { from, to } = getPaginationRange(page, ADMIN_DEFAULT_PAGE_SIZE);
  const notices: AdminNotice[] = [];

  let query = supabase
    .from("profiles")
    .select("id, email, name, role, created_at", { count: "exact" })
    .order("created_at", { ascending: false });

  const roleFromSearch = search === "reader" || search === "author" || search === "admin" ? search : "";
  const effectiveRole = params.role || roleFromSearch;

  if (effectiveRole) {
    query = query.eq("role", effectiveRole);
  }

  if (search && !roleFromSearch) {
    const term = safeLikeTerm(search);
    query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%`);
  }

  const { data, count, error } = await query.range(from, to);

  if (error) {
    return {
      items: [],
      pagination: buildPagination(0, page, ADMIN_DEFAULT_PAGE_SIZE),
      notices: [
        {
          id: "users-load-error",
          tone: "danger",
          title: "Impossible de charger les utilisateurs",
          description: error.message,
        },
      ],
    };
  }

  const users = (data ?? []) as AdminProfileMini[];
  const userIds = users.map((user) => user.id);

  const [libraryRows, orderRows, subscriptionsResult, ratingsResult, highlightsResult] = await Promise.all([
    userIds.length ? supabase.from("library").select("user_id").in("user_id", userIds) : Promise.resolve({ data: [] as Array<{ user_id: string }>, error: null }),
    userIds.length ? supabase.from("orders").select("user_id").in("user_id", userIds) : Promise.resolve({ data: [] as Array<{ user_id: string }>, error: null }),
    userIds.length
      ? supabase
          .from("user_subscriptions")
          .select("id, user_id, plan_id, status, started_at, expires_at, created_at, updated_at, plan:subscription_plans!user_subscriptions_plan_id_fkey(id, name, slug, monthly_price, currency_code, is_active)")
          .in("user_id", userIds)
          .returns<UserSubscriptionRow[]>()
      : Promise.resolve({ data: [] as UserSubscriptionRow[], error: null }),
    userIds.length ? supabase.from("ratings").select("user_id").in("user_id", userIds) : Promise.resolve({ data: [] as Array<{ user_id: string }>, error: null }),
    userIds.length ? supabase.from("highlights").select("user_id").in("user_id", userIds) : Promise.resolve({ data: [] as Array<{ user_id: string }>, error: null }),
  ]);

  if (ratingsResult.error) {
    notices.push({
      id: "ratings-missing",
      tone: "warning",
      title: "Ratings partiellement indisponibles",
      description: "Les compteurs de notes ont ete ignores car la table ou la policy correspondante n a pas repondu.",
    });
  }

  if (highlightsResult.error) {
    notices.push({
      id: "highlights-missing",
      tone: "warning",
      title: "Highlights partiellement indisponibles",
      description: "Les compteurs de highlights ont ete ignores car la table ou la policy correspondante n a pas repondu.",
    });
  }

  const libraryCountByUser = new Map<string, number>();
  (libraryRows.data ?? []).forEach((row) => {
    libraryCountByUser.set(row.user_id, (libraryCountByUser.get(row.user_id) ?? 0) + 1);
  });

  const orderCountByUser = new Map<string, number>();
  (orderRows.data ?? []).forEach((row) => {
    orderCountByUser.set(row.user_id, (orderCountByUser.get(row.user_id) ?? 0) + 1);
  });

  const ratingsCountByUser = new Map<string, number>();
  (ratingsResult.data ?? []).forEach((row) => {
    ratingsCountByUser.set(row.user_id, (ratingsCountByUser.get(row.user_id) ?? 0) + 1);
  });

  const highlightsCountByUser = new Map<string, number>();
  (highlightsResult.data ?? []).forEach((row) => {
    highlightsCountByUser.set(row.user_id, (highlightsCountByUser.get(row.user_id) ?? 0) + 1);
  });

  const subscriptionsByUser = new Map<string, UserSubscriptionRow[]>();
  (subscriptionsResult.data ?? []).forEach((subscription) => {
    const current = subscriptionsByUser.get(subscription.user_id) ?? [];
    current.push(subscription);
    subscriptionsByUser.set(subscription.user_id, current);
  });

  return {
    items: users.map((user) => {
      const activeSubscription = getActiveSubscription(subscriptionsByUser.get(user.id) ?? []);

      return {
        ...user,
        libraryCount: libraryCountByUser.get(user.id) ?? 0,
        orderCount: orderCountByUser.get(user.id) ?? 0,
        ratingsCount: ratingsCountByUser.get(user.id) ?? 0,
        highlightsCount: highlightsCountByUser.get(user.id) ?? 0,
        activeSubscription: activeSubscription
          ? {
              id: activeSubscription.id,
              status: activeSubscription.status,
              planName: firstOf(activeSubscription.plan)?.name ?? "Plan inconnu",
              expiresAt: activeSubscription.expires_at,
            }
          : null,
      };
    }),
    pagination: buildPagination(count, page, ADMIN_DEFAULT_PAGE_SIZE),
    notices,
  };
}

export async function getAdminUserDetail(userId: string): Promise<AdminUserDetail | null> {
  const supabase = await createClient();
  const notices: AdminNotice[] = [];

  const [
    profileResult,
    authorProfileResult,
    ordersResult,
    libraryResult,
    subscriptionsResult,
    ratingsResult,
    highlightsResult,
    engagementResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, email, name, role, created_at, first_name, last_name, phone, country, city, preferred_language, favorite_categories, marketing_opt_in",
      )
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("author_profiles")
      .select("id, display_name, avatar_url, location, website, bio, professional_headline, phone, genres, publishing_goals")
      .eq("id", userId)
      .maybeSingle(),
    supabase.from("orders").select("id, user_id, total_price, currency_code, payment_status, created_at").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase
      .from("library")
      .select("id, user_id, book_id, purchased_at, access_type, subscription_id, book:books(id, title, status, cover_url)")
      .eq("user_id", userId)
      .order("purchased_at", { ascending: false })
      .returns<UserLibraryRow[]>(),
    supabase
      .from("user_subscriptions")
      .select("id, user_id, plan_id, status, started_at, expires_at, created_at, updated_at, plan:subscription_plans!user_subscriptions_plan_id_fkey(id, name, slug, monthly_price, currency_code, is_active)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .returns<UserSubscriptionRow[]>(),
    supabase
      .from("ratings")
      .select("id, user_id, book_id, rating, created_at, updated_at, book:books(id, title, status)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .returns<UserRatingRow[]>(),
    supabase
      .from("highlights")
      .select("id, user_id, book_id, page, text, note, color, created_at, updated_at, book:books(id, title, status)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .returns<UserHighlightRow[]>(),
    supabase
      .from("book_engagement_events")
      .select("id, user_id, book_id, event_type, source, created_at, metadata, book:books(id, title, status)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30)
      .returns<UserEngagementRow[]>(),
  ]);

  const profile = (profileResult.data ?? null) as AdminUserProfileRow | null;

  if (!profile) {
    return null;
  }

  const orders = (ordersResult.data ?? []) as UserOrderRow[];
  const orderIds = orders.map((order) => order.id);
  const orderItemsResult =
    orderIds.length > 0
      ? await supabase
          .from("order_items")
          .select("id, order_id, book_id, price, currency_code, book:books(id, title, status)")
          .in("order_id", orderIds)
          .returns<UserOrderItemRow[]>()
      : { data: [] as UserOrderItemRow[], error: null };

  if (ratingsResult.error) {
    notices.push({
      id: "ratings-detail-error",
      tone: "warning",
      title: "Notes indisponibles",
      description: ratingsResult.error.message,
    });
  }

  if (highlightsResult.error) {
    notices.push({
      id: "highlights-detail-error",
      tone: "warning",
      title: "Highlights indisponibles",
      description: highlightsResult.error.message,
    });
  }

  if (engagementResult.error) {
    notices.push({
      id: "engagement-detail-error",
      tone: "warning",
      title: "Engagement livre indisponible",
      description: engagementResult.error.message,
    });
  }

  const orderItemsByOrderId = new Map<string, Array<UserOrderItemRow & { book_title: string }>>();
  (orderItemsResult.data ?? []).forEach((item) => {
    const current = orderItemsByOrderId.get(item.order_id) ?? [];
    current.push({
      ...item,
      book_title: firstOf(item.book)?.title ?? "Livre inconnu",
    });
    orderItemsByOrderId.set(item.order_id, current);
  });

  const engagementRows = engagementResult.data ?? [];

  return {
    profile,
    authorProfile: (authorProfileResult.data ?? null) as UserAuthorProfileRow | null,
    metrics: {
      libraryCount: (libraryResult.data ?? []).length,
      orderCount: orders.length,
      ratingsCount: (ratingsResult.data ?? []).length,
      highlightsCount: (highlightsResult.data ?? []).length,
      detailViews: engagementRows.filter((entry) => entry.event_type === "detail_view").length,
      readerOpenCount: engagementRows.filter((entry) => entry.event_type === "reader_open").length,
      fileAccessCount: engagementRows.filter((entry) => entry.event_type === "file_access").length,
    },
    orders: orders.map((order) => ({
      ...order,
      items: orderItemsByOrderId.get(order.id) ?? [],
    })),
    library: (libraryResult.data ?? []).map((entry) => ({
      ...entry,
      book_title: firstOf(entry.book)?.title ?? "Livre inconnu",
    })),
    subscriptions: (subscriptionsResult.data ?? []).map((subscription) => ({
      ...subscription,
      plan_name: firstOf(subscription.plan)?.name ?? "Plan inconnu",
    })),
    ratings: (ratingsResult.data ?? []).map((rating) => ({
      ...rating,
      book_title: firstOf(rating.book)?.title ?? "Livre inconnu",
    })),
    highlights: (highlightsResult.data ?? []).map((highlight) => ({
      ...highlight,
      book_title: firstOf(highlight.book)?.title ?? "Livre inconnu",
    })),
    engagements: engagementRows.map((entry) => ({
      ...entry,
      book_title: firstOf(entry.book)?.title ?? "Livre inconnu",
    })),
    notices,
  };
}
