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
  [key: string]: unknown;
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

export async function getSubscriptionPlans() {
  return (await apiServer<{ data: ApiSubscriptionPlan[] }>("plans", { authenticated: false })).data ?? [];
}
