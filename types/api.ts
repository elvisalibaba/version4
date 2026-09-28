export type UserRole = "reader" | "author" | "admin";
export type AffiliateSourceType = "book" | "plan";
export type LibraryAccessType = "purchase" | "subscription" | "free";
export type SubscriptionStatus = "active" | "cancelled" | "expired" | "past_due";
export type BookFormatType = "holistique_store" | "ebook" | "paperback" | "pocket" | "hardcover" | "audiobook";

export type ApiProfile = {
  role: UserRole;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  preferred_language: string;
  favorite_categories: string[];
  marketing_opt_in: boolean;
  author_profile?: Record<string, unknown> | null;
};

export type ApiUser = {
  id: string;
  email: string;
  name: string | null;
  email_verified_at: string | null;
  profile: ApiProfile;
};

export type ApiBookFormat = {
  id: string;
  format: BookFormatType;
  price: number | string;
  currency_code: string;
  stock_quantity?: number | null;
  downloadable: boolean;
  is_published: boolean;
};

export type ApiBook = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  price: number | string;
  currency_code: string;
  author_id: string;
  author_display_name: string | null;
  cover_url: string | null;
  cover_alt_text: string | null;
  status: "draft" | "published" | "archived" | "coming_soon";
  review_status?: string;
  copyright_status: "clear" | "review" | "blocked";
  language: string | null;
  publisher: string | null;
  publication_date: string | null;
  page_count: number | null;
  categories: string[];
  tags: string[];
  isbn: string | null;
  views_count: number;
  purchases_count: number;
  rating_avg: number | string | null;
  ratings_count: number;
  is_single_sale_enabled: boolean;
  is_subscription_available: boolean;
  formats?: ApiBookFormat[];
  subscription_plans?: Array<{
    id: string;
    name: string;
    slug: string;
    monthly_price: number | string;
    currency_code: string;
    is_active?: boolean;
  }>;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ApiPagination<T> = {
  data: T[];
  links?: Record<string, unknown>;
  meta?: { current_page?: number; last_page?: number; per_page?: number; total?: number };
};
