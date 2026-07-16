import type { Database } from "@/types/database";

export type AdminProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type AdminBookRow = Database["public"]["Tables"]["books"]["Row"];
export type AdminOrderRow = Database["public"]["Tables"]["orders"]["Row"];
export type AdminSubscriptionPlanRow = Database["public"]["Tables"]["subscription_plans"]["Row"];
export type AdminUserSubscriptionRow = Database["public"]["Tables"]["user_subscriptions"]["Row"];

export type AdminOption = {
  label: string;
  value: string;
};

export type AdminNoticeTone = "info" | "warning" | "success" | "danger";

export type AdminNotice = {
  id: string;
  tone: AdminNoticeTone;
  title: string;
  description: string;
};

export type AdminPaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AdminPagedResult<T> = {
  items: T[];
  pagination: AdminPaginationMeta;
};

export type AdminMetric = {
  label: string;
  value: string | number;
  hint?: string;
  trend?: string;
};

export type AdminChartDatum = {
  label: string;
  value: number;
  suffix?: string;
};

export type AdminRevenueBreakdown = {
  currencyCode: string;
  amount: number;
};
