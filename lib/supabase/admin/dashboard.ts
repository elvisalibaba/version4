import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/book-offers";
import {
  aggregateRevenueByCurrency,
  firstOf,
  formatRevenueBreakdown,
  resolveAssetUrl,
  signBookAssetPaths,
  type AdminAuthorMini,
  type AdminBookMini,
  type AdminProfileMini,
  type MaybeArray,
} from "@/lib/supabase/admin/shared";
import type { AdminNotice, AdminRevenueBreakdown } from "@/types/admin";

type BookWithAuthorRow = AdminBookMini & {
  author_profile: MaybeArray<Pick<AdminAuthorMini, "id" | "display_name" | "avatar_url">>;
  author_profile_fallback: MaybeArray<Pick<AdminProfileMini, "id" | "name" | "email">>;
};

type RecentOrderRow = {
  id: string;
  user_id: string;
  total_price: number;
  currency_code: string;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  created_at: string;
  user: MaybeArray<Pick<AdminProfileMini, "id" | "email" | "name" | "role">>;
};

type DashboardAuthorPerformer = {
  authorId: string;
  displayName: string;
  totalViews: number;
  totalPurchases: number;
  booksCount: number;
  estimatedSales: number;
  estimatedSalesLabel: string;
};

export type AdminDashboardData = {
  totals: {
    users: number;
    readers: number;
    authors: number;
    admins: number;
    books: number;
    publishedBooks: number;
    draftBooks: number;
    archivedBooks: number;
    comingSoonBooks: number;
    submittedBooks: number;
    orders: number;
    paidOrders: number;
    pendingOrders: number;
    activeSubscriptions: number;
    averageRating: number | null;
    revenueBreakdown: AdminRevenueBreakdown[];
    revenueLabel: string;
  };
  topViewedBooks: Array<BookWithAuthorRow & { cover_signed_url: string | null; author_name: string }>;
  topPurchasedBooks: Array<BookWithAuthorRow & { cover_signed_url: string | null; author_name: string }>;
  topAuthorsBySales: DashboardAuthorPerformer[];
  recentUsers: AdminProfileMini[];
  recentOrders: Array<RecentOrderRow & { itemCount: number; user_name: string }>;
  recentBooks: Array<BookWithAuthorRow & { cover_signed_url: string | null; author_name: string }>;
  recentSubmittedBooks: Array<BookWithAuthorRow & { cover_signed_url: string | null; author_name: string }>;
  ratingDistribution: Array<{ label: string; value: number }>;
  notices: AdminNotice[];
};

function hydrateBooks(rows: BookWithAuthorRow[], signedMap: Map<string, string>) {
  return rows.map((book) => ({
    ...book,
    cover_signed_url: resolveAssetUrl(book.cover_url, signedMap),
    author_name: firstOf(book.author_profile)?.display_name ?? firstOf(book.author_profile_fallback)?.name ?? "Auteur inconnu",
  }));
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = await createClient();

  const [
    usersCountResult,
    readersCountResult,
    authorsCountResult,
    adminsCountResult,
    booksCountResult,
    publishedBooksCountResult,
    draftBooksCountResult,
    archivedBooksCountResult,
    comingSoonBooksCountResult,
    submittedBooksCountResult,
    ordersCountResult,
    paidOrdersCountResult,
    pendingOrdersCountResult,
    paidOrdersRowsResult,
    activeSubscriptionsCountResult,
    topViewedBooksResult,
    topPurchasedBooksResult,
    recentUsersResult,
    recentOrdersResult,
    recentBooksResult,
    recentSubmittedBooksResult,
    authorPerformanceResult,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "reader"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "author"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin"),
    supabase.from("books").select("id", { count: "exact", head: true }),
    supabase.from("books").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("books").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("books").select("id", { count: "exact", head: true }).eq("status", "archived"),
    supabase.from("books").select("id", { count: "exact", head: true }).eq("status", "coming_soon"),
    supabase.from("books").select("id", { count: "exact", head: true }).eq("review_status", "submitted"),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("payment_status", "paid"),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("payment_status", "pending"),
    supabase.from("orders").select("total_price, currency_code").eq("payment_status", "paid"),
    supabase
      .from("user_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`),
    supabase
      .from("books")
      .select(
        "id, title, subtitle, status, cover_url, price, currency_code, views_count, purchases_count, rating_avg, ratings_count, publication_date, published_at, created_at, language, categories, is_single_sale_enabled, is_subscription_available, review_status, submitted_at, reviewed_at, reviewed_by, review_note, author_profile:author_profiles!books_author_profile_id_fkey(id, display_name, avatar_url), author_profile_fallback:profiles!books_author_id_fkey(id, name, email)",
      )
      .order("views_count", { ascending: false })
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(5)
      .returns<BookWithAuthorRow[]>(),
    supabase
      .from("books")
      .select(
        "id, title, subtitle, status, cover_url, price, currency_code, views_count, purchases_count, rating_avg, ratings_count, publication_date, published_at, created_at, language, categories, is_single_sale_enabled, is_subscription_available, review_status, submitted_at, reviewed_at, reviewed_by, review_note, author_profile:author_profiles!books_author_profile_id_fkey(id, display_name, avatar_url), author_profile_fallback:profiles!books_author_id_fkey(id, name, email)",
      )
      .order("purchases_count", { ascending: false })
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(5)
      .returns<BookWithAuthorRow[]>(),
    supabase.from("profiles").select("id, email, name, role, created_at").order("created_at", { ascending: false }).limit(6),
    supabase
      .from("orders")
      .select(
        "id, user_id, total_price, currency_code, payment_status, created_at, user:profiles!orders_user_id_fkey(id, email, name, role)",
      )
      .order("created_at", { ascending: false })
      .limit(6)
      .returns<RecentOrderRow[]>(),
    supabase
      .from("books")
      .select(
        "id, title, subtitle, status, cover_url, price, currency_code, views_count, purchases_count, rating_avg, ratings_count, publication_date, published_at, created_at, language, categories, is_single_sale_enabled, is_subscription_available, review_status, submitted_at, reviewed_at, reviewed_by, review_note, author_profile:author_profiles!books_author_profile_id_fkey(id, display_name, avatar_url), author_profile_fallback:profiles!books_author_id_fkey(id, name, email)",
      )
      .order("created_at", { ascending: false })
      .limit(6)
      .returns<BookWithAuthorRow[]>(),
    supabase
      .from("books")
      .select(
        "id, title, subtitle, status, cover_url, price, currency_code, views_count, purchases_count, rating_avg, ratings_count, publication_date, published_at, created_at, language, categories, is_single_sale_enabled, is_subscription_available, review_status, submitted_at, reviewed_at, reviewed_by, review_note, author_profile:author_profiles!books_author_profile_id_fkey(id, display_name, avatar_url), author_profile_fallback:profiles!books_author_id_fkey(id, name, email)",
      )
      .eq("review_status", "submitted")
      .order("submitted_at", { ascending: false, nullsFirst: false })
      .limit(6)
      .returns<BookWithAuthorRow[]>(),
    supabase
      .from("books")
      .select(
        "id, title, subtitle, status, cover_url, price, currency_code, views_count, purchases_count, rating_avg, ratings_count, publication_date, published_at, created_at, language, categories, is_single_sale_enabled, is_subscription_available, review_status, submitted_at, reviewed_at, reviewed_by, review_note, author_profile:author_profiles!books_author_profile_id_fkey(id, display_name, avatar_url), author_profile_fallback:profiles!books_author_id_fkey(id, name, email)",
      )
      .returns<BookWithAuthorRow[]>(),
  ]);

  const recentOrderIds = (recentOrdersResult.data ?? []).map((order) => order.id);
  const [recentOrderItemsResult, ratingsResult] = await Promise.all([
    recentOrderIds.length
      ? supabase.from("order_items").select("order_id").in("order_id", recentOrderIds)
      : Promise.resolve({ data: [] as Array<{ order_id: string }>, error: null }),
    supabase.from("ratings").select("rating"),
  ]);

  const coverPaths = [
    ...(topViewedBooksResult.data ?? []).map((book) => book.cover_url),
    ...(topPurchasedBooksResult.data ?? []).map((book) => book.cover_url),
    ...(recentBooksResult.data ?? []).map((book) => book.cover_url),
    ...(recentSubmittedBooksResult.data ?? []).map((book) => book.cover_url),
  ];
  const signedMap = await signBookAssetPaths(supabase, coverPaths);

  const revenueBreakdown = aggregateRevenueByCurrency(paidOrdersRowsResult.data ?? []);

  const authorMap = new Map<
    string,
    {
      displayName: string;
      totalViews: number;
      totalPurchases: number;
      booksCount: number;
      estimatedSales: number;
    }
  >();

  (authorPerformanceResult.data ?? []).forEach((book) => {
    const authorProfile = firstOf(book.author_profile);
    const authorFallback = firstOf(book.author_profile_fallback);
    const authorId = authorProfile?.id ?? authorFallback?.id;

    if (!authorId) return;

    const current = authorMap.get(authorId) ?? {
      displayName: authorProfile?.display_name ?? authorFallback?.name ?? "Auteur inconnu",
      totalViews: 0,
      totalPurchases: 0,
      booksCount: 0,
      estimatedSales: 0,
    };

    current.totalViews += book.views_count ?? 0;
    current.totalPurchases += book.purchases_count ?? 0;
    current.booksCount += 1;
    current.estimatedSales += Number(book.purchases_count ?? 0) * Number(book.price ?? 0);

    authorMap.set(authorId, current);
  });

  const ratingRows = ratingsResult.data ?? [];
  const ratingDistribution = [1, 2, 3, 4, 5].map((value) => ({
    label: `${value} etoile${value > 1 ? "s" : ""}`,
    value: ratingRows.filter((row) => Math.round(Number(row.rating)) === value).length,
  }));

  const averageRating =
    ratingRows.length > 0
      ? Number((ratingRows.reduce((total, row) => total + Number(row.rating ?? 0), 0) / ratingRows.length).toFixed(1))
      : null;

  const orderItemCountMap = new Map<string, number>();
  (recentOrderItemsResult.data ?? []).forEach((item) => {
    orderItemCountMap.set(item.order_id, (orderItemCountMap.get(item.order_id) ?? 0) + 1);
  });

  const notices: AdminNotice[] = [
    {
      id: "derived-stats",
      tone: "warning",
      title: "Stats derivees a surveiller",
      description:
        "Les colonnes books.views_count, purchases_count, rating_avg et ratings_count sont affichees telles qu elles existent. Si elles ne sont pas recalculees par trigger ou job, le dashboard peut montrer un decalage.",
    },
    {
      id: "library-sync",
      tone: "info",
      title: "Paiement et acces bibliotheque",
      description:
        "Le schema ne montre pas explicitement l automatisation orders.paid -> library. L admin peut changer le statut d une commande, mais la synchronisation d acces doit rester un point d extension backend explicite.",
    },
  ];

  if ((submittedBooksCountResult.count ?? 0) > 0) {
    notices.unshift({
      id: "review-queue",
      tone: "warning",
      title: "Soumissions auteur en attente",
      description: `${submittedBooksCountResult.count ?? 0} livre(s) attendent une validation admin. La file de revue doit etre traitee avant publication, surtout pour les formats papier et leur arbitrage prix / impression.`,
    });
  }

  if (ratingsResult.error) {
    notices.push({
      id: "ratings-policy",
      tone: "warning",
      title: "Ratings indisponibles",
      description:
        "La lecture des ratings a echoue. Cela suggere soit une policy RLS manquante, soit un drift entre schema runtime et migrations locales.",
    });
  }

  return {
    totals: {
      users: usersCountResult.count ?? 0,
      readers: readersCountResult.count ?? 0,
      authors: authorsCountResult.count ?? 0,
      admins: adminsCountResult.count ?? 0,
      books: booksCountResult.count ?? 0,
      publishedBooks: publishedBooksCountResult.count ?? 0,
      draftBooks: draftBooksCountResult.count ?? 0,
      archivedBooks: archivedBooksCountResult.count ?? 0,
      comingSoonBooks: comingSoonBooksCountResult.count ?? 0,
      submittedBooks: submittedBooksCountResult.count ?? 0,
      orders: ordersCountResult.count ?? 0,
      paidOrders: paidOrdersCountResult.count ?? 0,
      pendingOrders: pendingOrdersCountResult.count ?? 0,
      activeSubscriptions: activeSubscriptionsCountResult.count ?? 0,
      averageRating,
      revenueBreakdown,
      revenueLabel: formatRevenueBreakdown(revenueBreakdown),
    },
    topViewedBooks: hydrateBooks(topViewedBooksResult.data ?? [], signedMap),
    topPurchasedBooks: hydrateBooks(topPurchasedBooksResult.data ?? [], signedMap),
    topAuthorsBySales: Array.from(authorMap.entries())
      .map(([authorId, value]) => ({
        authorId,
        displayName: value.displayName,
        totalViews: value.totalViews,
        totalPurchases: value.totalPurchases,
        booksCount: value.booksCount,
        estimatedSales: value.estimatedSales,
        estimatedSalesLabel: formatMoney(value.estimatedSales),
      }))
      .sort((left, right) => right.estimatedSales - left.estimatedSales)
      .slice(0, 5),
    recentUsers: (recentUsersResult.data ?? []) as AdminProfileMini[],
    recentOrders: (recentOrdersResult.data ?? []).map((order) => ({
      ...order,
      itemCount: orderItemCountMap.get(order.id) ?? 0,
      user_name: firstOf(order.user)?.name ?? firstOf(order.user)?.email ?? "Utilisateur inconnu",
    })),
    recentBooks: hydrateBooks(recentBooksResult.data ?? [], signedMap),
    recentSubmittedBooks: hydrateBooks(recentSubmittedBooksResult.data ?? [], signedMap),
    ratingDistribution,
    notices,
  };
}
