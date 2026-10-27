import { apiServer } from "@/lib/api/server";
import type { ApiAuthorBook, ApiAuthorProfile, ApiSubscriptionPlan } from "@/types/api";

export type AuthorDashboardPayload = {
  profile: ApiAuthorProfile;
  stats: {
    books: number;
    published_books: number;
    views: number;
    clicks: number;
    purchases: number;
    revenue: number;
    audiobooks: number;
    videos: number;
  };
  recent_books: ApiAuthorBook[];
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
  id: string;
  user_id: string;
  currency_code: string;
  pending_balance: number | string;
  available_balance: number | string;
  lifetime_earnings: number | string;
  lifetime_paid: number | string;
  minimum_payout: number | string;
  status: "active" | "review" | "suspended";
};

type RoyaltyTotals = {
  pending: number;
  payable: number;
  lifetime: number;
};

export type AuthorFinanceSummary = {
  /** Portefeuille principal (devise par défaut). */
  account: AuthorRoyaltyAccount | null;
  /** Un portefeuille par devise de vente (USD, CDF…). */
  accounts?: AuthorRoyaltyAccount[];
  /** Totaux dans la devise du portefeuille principal. */
  royalties: RoyaltyTotals;
  royalties_by_currency?: Record<string, RoyaltyTotals>;
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

export type AuthorFinanceStatement = {
  period: { from: string; to: string };
  totals: {
    gross_amount: number;
    printing_cost: number;
    platform_fee: number;
    tax_withholding: number;
    net_royalty: number;
  };
  by_book: Array<{
    book_id: string;
    currency_code: string;
    transactions_count: number;
    gross_amount: number | string;
    platform_fee: number | string;
    printing_cost: number | string;
    tax_withholding: number | string;
    net_royalty: number | string;
    book?: { id: string; title: string } | null;
  }>;
  by_source: Array<{
    source: string;
    currency_code: string;
    transactions_count: number;
    gross_amount: number | string;
    net_royalty: number | string;
  }>;
};

export type AuthorReviewCase = {
  id: string;
  case_number: string;
  case_type: "metadata" | "rights" | "content" | "quality" | "payment" | "account" | "other";
  severity: "info" | "warning" | "blocking";
  status: "open" | "author_action" | "under_review" | "resolved" | "rejected" | "appealed";
  reason_code?: string | null;
  title: string;
  explanation: string;
  required_action?: string | null;
  author_response?: string | null;
  resolution_note?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
  book?: { id: string; title: string } | null;
};

export type AuthorBookWorkspace = ApiAuthorBook & {
  author_workspace?: {
    writing_status?: string | null;
    target_word_count?: number | null;
    current_word_count?: number | null;
    next_author_action?: string | null;
    editorial_deadline?: string | null;
    author_private_notes?: string | null;
    editorial_stage?: string | null;
    bat_status?: string | null;
    manuscript_versions?: Array<{
      id: string;
      version_number: number;
      file_format?: string | null;
      file_size?: number | null;
      status?: string | null;
      change_summary?: string | null;
      created_at?: string | null;
    }>;
  };
  reader_rights?: {
    reading_access_mode?: string | null;
    can_read_on_platform?: boolean;
    allow_download?: boolean;
    allow_print?: boolean;
    allow_copy?: boolean;
    reader_watermark_enabled?: boolean;
    rights_agreement_reference?: string | null;
    reader_rights_note?: string | null;
  };
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
  return (await apiServer<{ data: ApiAuthorBook[] }>("author/books")).data ?? [];
}

export async function getAuthorBook(bookId: string) {
  return (await apiServer<{ data: AuthorBookWorkspace }>(
    `author/books/${encodeURIComponent(bookId)}`,
  )).data;
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

export async function getAuthorFinanceStatement(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  const suffix = params.toString() ? `?${params.toString()}` : "";
  return (await apiServer<{ data: AuthorFinanceStatement }>(`author/finance/statement${suffix}`)).data;
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

export async function getAuthorReviewCases(perPage = 50) {
  const response = await apiServer<{ data?: AuthorReviewCase[] } & Record<string, unknown>>(
    `author/review-cases?per_page=${Math.min(100, Math.max(1, perPage))}`,
  );

  return response.data ?? [];
}

export async function getAuthorDistribution(bookId: string) {
  return (await apiServer<{ data: AuthorDistributionSettings | null }>(
    `author/books/${encodeURIComponent(bookId)}/distribution`,
  )).data;
}

export async function getSubscriptionPlans() {
  return (await apiServer<{ data: ApiSubscriptionPlan[] }>("plans", { authenticated: false })).data ?? [];
}
