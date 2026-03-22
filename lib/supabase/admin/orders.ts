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
      title: "Synchro paiement active",
      description:
        "Les commandes ebook et papier sont visibles cote admin, en pending comme en paid. Seuls les items ebook debloquent l acces library.",
    },
  ];

  let query = supabase
    .from("orders")
    .select("id, user_id, total_price, currency_code, payment_status, created_at, user:profiles!orders_user_id_fkey(id, name, email, role)", {
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

  const orderIds = (data ?? []).map((order) => order.id);
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
    items: (data ?? []).map((order) => ({
      ...order,
      user_name: firstOf(order.user)?.name ?? firstOf(order.user)?.email ?? "Utilisateur inconnu",
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
      title: "Resynchronisation library disponible",
      description:
        "Les lignes de commande incluent maintenant le format (ebook, paperback, hardcover). Les commandes papier restent visibles sans debloquer library.",
    },
  ];

  const orderResult = await supabase
    .from("orders")
    .select("id, user_id, total_price, currency_code, payment_status, created_at, user:profiles!orders_user_id_fkey(id, name, email, role)")
    .eq("id", orderId)
    .returns<OrderRow>()
    .maybeSingle();

  const order = (orderResult.data ?? null) as OrderRow | null;

  if (!order) {
    return null;
  }

  const itemsResult = await supabase
    .from("order_items")
    .select("id, order_id, book_id, price, currency_code, book_format, book:books(id, title, status)")
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

  return {
    order: {
      ...order,
      user_name: firstOf(order.user)?.name ?? firstOf(order.user)?.email ?? "Utilisateur inconnu",
      itemCount: (itemsResult.data ?? []).length,
      formatBreakdown: detailFormatBreakdown,
    },
    items: (itemsResult.data ?? []).map((item) => ({
      ...item,
      book_title: firstOf(item.book)?.title ?? "Livre inconnu",
    })),
    notices,
  };
}
