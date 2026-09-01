import { createEmptyFormatBreakdown } from "@/lib/book-formats";
import { createClient } from "@/lib/supabase/server";
import {
  ADMIN_DEFAULT_PAGE_SIZE,
  buildPagination,
  firstOf,
  getPaginationRange,
  isUuid,
  normalizeSearchTerm,
  safeLikeTerm,
  type AdminProfileMini,
  type MaybeArray,
} from "@/lib/supabase/admin/shared";
import type { AdminNotice, AdminPagedResult } from "@/types/admin";
import type { BookFormatType, OrderPaymentStatus } from "@/types/database";

type OrderRow = {
  id: string;
  user_id: string;
  total_price: number;
  currency_code: string;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  created_at: string;
  user: MaybeArray<Pick<AdminProfileMini, "id" | "name" | "email" | "role">>;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  book_id: string;
  price: number;
  currency_code: string;
  book_format: BookFormatType;
  book: MaybeArray<{ id: string; title: string; status: string }>;
};

export type AdminOrderListItem = OrderRow & {
  user_name: string;
  itemCount: number;
  formatBreakdown: Record<BookFormatType, number>;
};

export type AdminOrdersPageData = AdminPagedResult<AdminOrderListItem> & {
  notices: AdminNotice[];
};

export type AdminOrderDetail = {
  order: AdminOrderListItem;
  items: Array<OrderItemRow & { book_title: string }>;
  notices: AdminNotice[];
};

function resolvePeriodStart(period?: string) {
  if (!period) return null;
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  switch (period) {
    case "7d":
      return new Date(now - 7 * day).toISOString();
    case "30d":
      return new Date(now - 30 * day).toISOString();
    case "90d":
      return new Date(now - 90 * day).toISOString();
    case "365d":
      return new Date(now - 365 * day).toISOString();
    default:
      return null;
  }
}

async function resolveOrderSearchUserIds(search: string) {
  const supabase = await createClient();
  const term = safeLikeTerm(search);
  const { data } = await supabase.from("profiles").select("id").or(`name.ilike.%${term}%,email.ilike.%${term}%`);
  return (data ?? []).map((row) => row.id);
}

export async function listAdminOrders(params: {
  page?: number;
  search?: string;
  paymentStatus?: string;
  period?: string;
}): Promise<AdminOrdersPageData> {
  const supabase = await createClient();
  const page = params.page ?? 1;
  const search = normalizeSearchTerm(params.search);
  const { from, to } = getPaginationRange(page, ADMIN_DEFAULT_PAGE_SIZE);
  const notices: AdminNotice[] = [
    {
      id: "payment-warning",
      tone: "info",
      title: "Suivi des paiements",
      description: "Les commandes numériques et imprimées apparaissent ici dès leur création, quel que soit leur état.",
    },
  ];

  let query = supabase
    .from("orders")
    .select("id, user_id, total_price, currency_code, payment_status, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  if (params.paymentStatus) {
    query = query.eq("payment_status", params.paymentStatus as OrderPaymentStatus);
  }

  const periodStart = resolvePeriodStart(params.period);
  if (periodStart) {
    query = query.gte("created_at", periodStart);
  }

  if (search) {
    if (isUuid(search)) {
      query = query.eq("id", search);
    } else {
      const userIds = await resolveOrderSearchUserIds(search);
      if (!userIds.length) {
        return {
          items: [],
          pagination: buildPagination(0, page, ADMIN_DEFAULT_PAGE_SIZE),
          notices,
        };
      }

      query = query.in("user_id", userIds);
    }
  }

  const { data, count, error } = await query.range(from, to).returns<OrderRow[]>();

  if (error) {
    return {
      items: [],
      pagination: buildPagination(0, page, ADMIN_DEFAULT_PAGE_SIZE),
      notices: [
        {
          id: "orders-load-error",
          tone: "danger",
          title: "Impossible de charger les commandes",
          description: error.message,
        },
      ],
    };
  }

  const rawOrders = data ?? [];
  const orderIds = rawOrders.map((order) => order.id);
  const userIds = Array.from(new Set(rawOrders.map((order) => order.user_id)));
  const profilesResult = userIds.length
    ? await supabase.from("profiles").select("id, name, email, role").in("id", userIds)
    : { data: [] };
  const profilesById = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile]));
  const orderItemsResult =
    orderIds.length > 0
      ? await supabase.from("order_items").select("order_id, book_format").in("order_id", orderIds)
      : { data: [] as Array<{ order_id: string; book_format: BookFormatType }>, error: null };

  const itemCountByOrderId = new Map<string, number>();
  const formatByOrderId = new Map<string, Record<BookFormatType, number>>();

  function ensureFormatBucket(orderId: string) {
    const current = formatByOrderId.get(orderId);
    if (current) return current;

    const next = createEmptyFormatBreakdown();
    formatByOrderId.set(orderId, next);
    return next;
  }

  (orderItemsResult.data ?? []).forEach((item) => {
    itemCountByOrderId.set(item.order_id, (itemCountByOrderId.get(item.order_id) ?? 0) + 1);
    const bucket = ensureFormatBucket(item.order_id);
    const key = item.book_format ?? "ebook";

    if (key in bucket) {
      bucket[key as keyof typeof bucket] += 1;
    } else {
      bucket.ebook += 1;
    }
  });

  return {
    items: rawOrders.map((order) => ({
      ...order,
      user: profilesById.get(order.user_id) ?? null,
      user_name: profilesById.get(order.user_id)?.name ?? profilesById.get(order.user_id)?.email ?? "Utilisateur inconnu",
      itemCount: itemCountByOrderId.get(order.id) ?? 0,
      formatBreakdown: formatByOrderId.get(order.id) ?? createEmptyFormatBreakdown(),
    })),
    pagination: buildPagination(count, page, ADMIN_DEFAULT_PAGE_SIZE),
    notices,
  };
}

export async function getAdminOrderDetail(orderId: string): Promise<AdminOrderDetail | null> {
  const supabase = await createClient();
  const notices: AdminNotice[] = [
    {
      id: "order-sync-warning",
      tone: "info",
      title: "Informations de la commande",
      description: "Les formats numériques et imprimés sont détaillés séparément dans cette commande.",
    },
  ];

  const orderResult = await supabase
    .from("orders")
    .select("id, user_id, total_price, currency_code, payment_status, created_at")
    .eq("id", orderId)
    .returns<OrderRow>()
    .maybeSingle();

  const rawOrder = (orderResult.data ?? null) as Omit<OrderRow, "user"> | null;

  if (!rawOrder) {
    return null;
  }

  const { data: profile } = await supabase.from("profiles").select("id, name, email, role").eq("id", rawOrder.user_id).maybeSingle();
  const order: OrderRow = { ...rawOrder, user: profile ?? null };

  const itemsResult = await supabase
    .from("order_items")
    .select("id, order_id, book_id, price, currency_code, book_format")
    .eq("order_id", orderId)
    .returns<OrderItemRow[]>();

  const detailFormatBreakdown = createEmptyFormatBreakdown();

  (itemsResult.data ?? []).forEach((item) => {
    const key = item.book_format ?? "ebook";
    if (key in detailFormatBreakdown) {
      detailFormatBreakdown[key as keyof typeof detailFormatBreakdown] += 1;
    } else {
      detailFormatBreakdown.ebook += 1;
    }
  });

  const rawItems = itemsResult.data ?? [];
  const bookIds = Array.from(new Set(rawItems.map((item) => item.book_id)));
  const booksResult = bookIds.length ? await supabase.from("books").select("id, title, status").in("id", bookIds) : { data: [] };
  const booksById = new Map((booksResult.data ?? []).map((book) => [book.id, book]));

  return {
    order: {
      ...order,
      user_name: firstOf(order.user)?.name ?? firstOf(order.user)?.email ?? "Utilisateur inconnu",
      itemCount: (itemsResult.data ?? []).length,
      formatBreakdown: detailFormatBreakdown,
    },
    items: rawItems.map((item) => ({
      ...item,
      book: booksById.get(item.book_id) ?? null,
      book_title: booksById.get(item.book_id)?.title ?? "Livre inconnu",
    })),
    notices,
  };
}
