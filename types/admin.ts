import type {
  ApiBook,
  ApiOrder,
  ApiProfile,
  ApiSubscription,
  ApiSubscriptionPlan,
} from "@/types/api";

export type AdminProfileRow = ApiProfile & {
  id: string;
  email: string;
  name: string | null;
  created_at?: string;
};

export type AdminBookRow = ApiBook;
export type AdminOrderRow = ApiOrder;
export type AdminSubscriptionPlanRow = ApiSubscriptionPlan;
export type AdminUserSubscriptionRow = ApiSubscription;

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
