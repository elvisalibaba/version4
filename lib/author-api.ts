import { apiServer } from "@/lib/api/server";
import type { ApiAuthorProfile, ApiBook, ApiSubscriptionPlan } from "@/types/api";

export type AuthorDashboardPayload = {
  profile: ApiAuthorProfile;
  stats: {
    books: number;
    published_books: number;
    views: number;
    clicks: number;
    purchases: number;
    revenue: number;
  };
  recent_books: ApiBook[];
};

export type AuthorSale = {
  id?: string;
  order_id?: string;
  created_at?: string | null;
  payment_status?: string | null;
  title?: string | null;
  price?: number | string | null;
  currency_code?: string | null;
  quantity?: number | null;
  book_id?: string | null;
  book_format?: string | null;
  payment_provider?: string | null;
  payment_channel?: string | null;
  [key: string]: unknown;
};

export type AuthorRoyaltyAccount = {
  user_id: string;
  currency_code: string;
  pending_balance: number | string;
  available_balance: number | string;
  lifetime_earnings: number | string;
  lifetime_paid: number | string;
  minimum_payout: number | string;
  status: "active" | "review" | "suspended";
};

export type AuthorFinanceSummary = {
  account: AuthorRoyaltyAccount | null;
  royalties: {
    pending: number;
    payable: number;
    lifetime: number;
  };
};

export type AuthorRoyaltyTransaction = {
  id: string;
  book_id: string;
  order_id?: string | null;
  source: "ebook" | "print" | "subscription" | "institutional" | "other";
  gross_amount: number | string;
  printing_cost: number | string;
  platform_fee: number | string;
  tax_withholding: number | string;
  royalty_rate: number | string;
  net_royalty: number | string;
  currency_code: string;
  status: "pending" | "payable" | "paid" | "reversed";
  earned_at: string;
  payable_at?: string | null;
  paid_at?: string | null;
  book?: { id: string; title: string } | null;
};

export type AuthorPayoutAccount = {
  id: string;
  method: "bank_transfer" | "mobile_money";
  provider?: string | null;
  country_code: string;
  currency_code: string;
  account_name: string;
  is_default: boolean;
  is_verified: boolean;
  verified_at?: string | null;
  created_at?: string | null;
};

export type AuthorPayout = {
  id: string;
  payout_account_id?: string | null;
  amount: number | string;
  currency_code: string;
  status: "requested" | "approved" | "processing" | "paid" | "failed" | "rejected" | "cancelled";
  provider_reference?: string | null;
  notes?: string | null;
  requested_at: string;
  processed_at?: string | null;
  payout_account?: Pick<AuthorPayoutAccount, "id" | "provider" | "method" | "country_code" | "currency_code" | "account_name"> | null;
};

export type AuthorDistributionSettings = {
  book_id: string;
  primary_market: string;
  territory_mode: "worldwide" | "selected";
  territories: string[];
  sales_channels: string[];
  local_currency: string;
  royalty_rate: number | string | null;
  preorder_enabled: boolean;
  launch_date?: string | null;
  print_on_demand_enabled: boolean;
  local_print_enabled: boolean;
  institutional_sales_enabled: boolean;
  bookstore_distribution_enabled: boolean;
  distribution_notes?: string | null;
};

export async function getAuthorDashboard() {
  return (await apiServer<{ data: AuthorDashboardPayload }>("author/dashboard")).data;
}

export async function getAuthorBooks() {
  return (await apiServer<{ data: ApiBook[] }>("author/books")).data ?? [];
}

export async function getAuthorProfile() {
  return (await apiServer<{ data: ApiAuthorProfile }>("author/profile")).data;
}

export async function getAuthorSales() {
  const response = await apiServer<{ data?: AuthorSale[] } & Record<string, unknown>>("author/sales");
  return (response.data ?? []) as AuthorSale[];
}

export async function getAuthorFinanceSummary() {
  return (await apiServer<{ data: AuthorFinanceSummary }>("author/finance/summary")).data;
}

export async function getAuthorRoyalties(perPage = 25) {
  const response = await apiServer<{ data?: AuthorRoyaltyTransaction[] } & Record<string, unknown>>(
    `author/finance/royalties?per_page=${Math.min(100, Math.max(1, perPage))}`,
  );

  return response.data ?? [];
}

export async function getAuthorPayoutAccounts() {
  return (await apiServer<{ data: AuthorPayoutAccount[] }>("author/finance/payout-accounts")).data ?? [];
}

export async function getAuthorPayouts() {
  return (await apiServer<{ data: AuthorPayout[] }>("author/finance/payouts")).data ?? [];
}

export async function getAuthorDistribution(bookId: string) {
  return (await apiServer<{ data: AuthorDistributionSettings | null }>(
    `author/books/${encodeURIComponent(bookId)}/distribution`,
  )).data;
}

export async function getSubscriptionPlans() {
  return (await apiServer<{ data: ApiSubscriptionPlan[] }>("plans", { authenticated: false })).data ?? [];
}
