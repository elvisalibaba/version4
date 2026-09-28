import { apiServer } from "@/lib/api/server";
import type { ApiBook, ApiLibraryEntry, ApiOrder, ApiPagination, ApiSubscription, ApiSubscriptionPlan } from "@/types/api";

export type ReaderDashboardPayload = {
  stats: {
    library: number;
    favorites: number;
    orders: number;
    active_subscriptions: number;
  };
  library: ApiLibraryEntry[];
  orders: ApiOrder[];
  subscriptions: ApiSubscription[];
};

export type ReaderAffiliatePayload = {
  wallet: {
    affiliate_code: string;
    commission_rate: number | string;
    wallet_balance: number | string;
    lifetime_credited: number | string;
    currency_code: string;
    is_active: boolean;
  };
  subscription_commissions: Array<Record<string, unknown>>;
  order_commissions: Array<Record<string, unknown>>;
  payout_accounts: Array<Record<string, unknown>>;
};

export async function getReaderDashboard() {
  return (await apiServer<{ data: ReaderDashboardPayload }>("reader/dashboard")).data;
}

export async function getReaderLibrary() {
  return (await apiServer<ApiPagination<ApiLibraryEntry>>("library")).data ?? [];
}

export async function getReaderFavorites() {
  return (await apiServer<ApiPagination<ApiBook>>("favorites")).data ?? [];
}

export async function getReaderOrders() {
  return (await apiServer<ApiPagination<ApiOrder>>("orders")).data ?? [];
}

export async function getReaderSubscriptions() {
  return (await apiServer<ApiPagination<ApiSubscription>>("subscriptions")).data ?? [];
}

export async function getActivePlans() {
  return (await apiServer<{ data: ApiSubscriptionPlan[] }>("plans", { authenticated: false })).data ?? [];
}

export async function getReaderAffiliate() {
  return (await apiServer<{ data: ReaderAffiliatePayload }>("reader/affiliate")).data;
}
