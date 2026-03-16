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
import type { OrderPaymentStatus } from "@/types/database";

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
  book: MaybeArray<{ id: string; title: string; status: string }>;
};

export type AdminOrderListItem = OrderRow & {
  user_name: string;
  itemCount: number;
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
      tone: "warning",
      title: "Changement de statut paiement",
      description:
        "Toute transition de payment_status doit rester securisee cote backend. Si une commande passe a paid, la synchronisation library doit etre declenchee explicitement et non supposee.",
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
      ? await supabase.from("order_items").select("order_id").in("order_id", orderIds)
      : { data: [] as Array<{ order_id: string }>, error: null };

  const itemCountByOrderId = new Map<string, number>();
  (orderItemsResult.data ?? []).forEach((item) => {
    itemCountByOrderId.set(item.order_id, (itemCountByOrderId.get(item.order_id) ?? 0) + 1);
  });

  return {
    items: (data ?? []).map((order) => ({
      ...order,
      user_name: firstOf(order.user)?.name ?? firstOf(order.user)?.email ?? "Utilisateur inconnu",
      itemCount: itemCountByOrderId.get(order.id) ?? 0,
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
      title: "Point d extension library",
      description:
        "Si le statut passe a paid, il faut verifier la creation ou la correction des entrees library associees. Cette relation n est pas supposee implicite par l interface.",
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
    .select("id, order_id, book_id, price, currency_code, book:books(id, title, status)")
    .eq("order_id", orderId)
    .returns<OrderItemRow[]>();

  return {
    order: {
      ...order,
      user_name: firstOf(order.user)?.name ?? firstOf(order.user)?.email ?? "Utilisateur inconnu",
      itemCount: (itemsResult.data ?? []).length,
    },
    items: (itemsResult.data ?? []).map((item) => ({
      ...item,
      book_title: firstOf(item.book)?.title ?? "Livre inconnu",
    })),
    notices,
  };
}
