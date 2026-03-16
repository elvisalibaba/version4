import { formatMoney } from "@/lib/book-offers";
import { createClient } from "@/lib/supabase/server";
import type { BookReviewStatus, Database, OrderPaymentStatus, SubscriptionStatus } from "@/types/database";
import type { AdminPaginationMeta, AdminRevenueBreakdown } from "@/types/admin";

export const ADMIN_DEFAULT_PAGE_SIZE = 12;
export const ADMIN_COMPACT_PAGE_SIZE = 8;
export const ADMIN_MAX_PAGE_SIZE = 50;

export type AdminClient = Awaited<ReturnType<typeof createClient>>;
export type MaybeArray<T> = T | T[] | null;
export type AdminProfileMini = Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "email" | "name" | "role" | "created_at">;
export type AdminAuthorMini = Pick<
  Database["public"]["Tables"]["author_profiles"]["Row"],
  "id" | "display_name" | "avatar_url" | "location" | "website" | "bio"
>;
export type AdminBookMini = Pick<
  Database["public"]["Tables"]["books"]["Row"],
  | "id"
  | "title"
  | "subtitle"
  | "author_id"
  | "status"
  | "cover_url"
  | "price"
  | "currency_code"
  | "views_count"
  | "purchases_count"
  | "rating_avg"
  | "ratings_count"
  | "publication_date"
  | "published_at"
  | "created_at"
  | "language"
  | "categories"
  | "is_single_sale_enabled"
  | "is_subscription_available"
  | "review_status"
  | "submitted_at"
  | "reviewed_at"
  | "reviewed_by"
  | "review_note"
>;
export type AdminPlanMini = Pick<
  Database["public"]["Tables"]["subscription_plans"]["Row"],
  "id" | "name" | "slug" | "description" | "monthly_price" | "currency_code" | "is_active" | "created_at" | "updated_at"
>;
export type AdminSubscriptionMini = Pick<
  Database["public"]["Tables"]["user_subscriptions"]["Row"],
  "id" | "user_id" | "plan_id" | "status" | "started_at" | "expires_at" | "created_at" | "updated_at"
>;

export function firstOf<T>(value: MaybeArray<T>): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function parsePageParam(value?: string | null) {
  const parsed = Number(value ?? "");
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
}

export function parsePageSizeParam(value?: string | null, fallback = ADMIN_DEFAULT_PAGE_SIZE) {
  const parsed = Number(value ?? "");
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(Math.floor(parsed), ADMIN_MAX_PAGE_SIZE);
}

export function getPaginationRange(page: number, pageSize: number) {
  const safePage = Math.max(page, 1);
  const safePageSize = Math.max(pageSize, 1);
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;
  return { from, to };
}

export function buildPagination(total: number | null, page: number, pageSize: number): AdminPaginationMeta {
  const safeTotal = Math.max(total ?? 0, 0);
  const totalPages = safeTotal > 0 ? Math.ceil(safeTotal / pageSize) : 1;
  return {
    page,
    pageSize,
    total: safeTotal,
    totalPages,
  };
}

export function normalizeSearchTerm(value?: string | null) {
  return value?.trim() ?? "";
}

export function parseBooleanFilter(value?: string | null) {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

export function splitCommaSeparatedValues(value?: string | null) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function resolveAssetUrl(path: string | null | undefined, signedMap?: Map<string, string>) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return signedMap?.get(path) ?? null;
}

export async function signBookAssetPaths(client: AdminClient, paths: Array<string | null | undefined>) {
  const validPaths = Array.from(
    new Set(
      paths.filter(
        (path): path is string => typeof path === "string" && path.length > 0 && !path.startsWith("http://") && !path.startsWith("https://"),
      ),
    ),
  );

  const signedMap = new Map<string, string>();

  await Promise.all(
    validPaths.map(async (path) => {
      const { data } = await client.storage.from("books").createSignedUrl(path, 60 * 60);
      if (data?.signedUrl) {
        signedMap.set(path, data.signedUrl);
      }
    }),
  );

  return signedMap;
}

export function aggregateRevenueByCurrency(rows: Array<{ total_price: number; currency_code: string }>): AdminRevenueBreakdown[] {
  const aggregate = new Map<string, number>();

  rows.forEach((row) => {
    const key = row.currency_code || "USD";
    aggregate.set(key, (aggregate.get(key) ?? 0) + Number(row.total_price ?? 0));
  });

  return Array.from(aggregate.entries())
    .map(([currencyCode, amount]) => ({ currencyCode, amount }))
    .sort((left, right) => right.amount - left.amount);
}

export function formatRevenueBreakdown(breakdown: AdminRevenueBreakdown[]) {
  if (breakdown.length === 0) return formatMoney(0);
  return breakdown.map((entry) => formatMoney(entry.amount, entry.currencyCode)).join(" / ");
}

export function isUuid(value?: string | null) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}

export function safeLikeTerm(value: string) {
  return value.replace(/[%_,]/g, " ").trim();
}

export function isSubscriptionActive(subscription: Pick<Database["public"]["Tables"]["user_subscriptions"]["Row"], "status" | "expires_at">) {
  if (subscription.status !== "active") return false;
  if (!subscription.expires_at) return true;
  return new Date(subscription.expires_at).getTime() > Date.now();
}

export function isPaymentStatus(value: string): value is OrderPaymentStatus {
  return value === "pending" || value === "paid" || value === "failed" || value === "refunded";
}

export function isSubscriptionStatus(value: string): value is SubscriptionStatus {
  return value === "active" || value === "cancelled" || value === "expired" || value === "past_due";
}

export function isBookReviewStatus(value: string): value is BookReviewStatus {
  return value === "draft" || value === "submitted" || value === "approved" || value === "rejected" || value === "changes_requested";
}

export function getSupabaseErrorMessage(error: { message?: string } | null | undefined, fallback: string) {
  return error?.message || fallback;
}

export function formatAdminDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function formatAdminDateTime(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatCompactNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("fr-FR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value ?? 0);
}
