export type UserRole = "reader" | "author" | "admin";
export type AffiliateSourceType = "book" | "plan";
export type LibraryAccessType = "purchase" | "subscription" | "free";
export type SubscriptionStatus = "active" | "cancelled" | "expired" | "past_due";
export type OrderPaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type BookReviewStatus = "draft" | "submitted" | "approved" | "rejected" | "changes_requested";
export type BookStatus = "draft" | "published" | "archived" | "coming_soon";
export type CopyrightStatus = "clear" | "review" | "blocked";
export type BookFormatType = "holistique_store" | "ebook" | "paperback" | "pocket" | "hardcover" | "audiobook";
export type MediaEditionType = "ebook" | "audiobook" | "video" | "print" | "bundle";

export type ApiMediaEdition = {
  id: string;
  media_type: MediaEditionType;
  title: string | null;
  language: string;
  duration_seconds: number | null;
  narrator: string | null;
  presenter: string | null;
  preview_url: string | null;
  status: "draft" | "processing" | "published" | "archived";
};

export type ApiAuthorProfile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  location: string | null;
  country_code?: string | null;
  catalog_origin?: "platform" | "publisher_catalog" | "international_reference" | string;
  rights_status?: "unknown" | "not_acquired" | "negotiating" | "acquired" | "expired" | "blocked" | string;
  is_reference_profile?: boolean;
  reference_source_url?: string | null;
  social_links: Record<string, unknown>;
  professional_headline: string | null;
  phone?: string | null;
  genres: string[];
  publishing_goals: string | null;
  favorite_book: string | null;
  favorite_author: string | null;
  favorite_character: string | null;
  press_mentions: Array<Record<string, unknown>>;
};

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
  author_profile?: ApiAuthorProfile | null;
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
  file_size_mb?: number | null;
  downloadable: boolean;
  is_published: boolean;
  printing_cost?: number | string | null;
};

export type ApiSubscriptionPlan = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  monthly_price: number | string;
  currency_code: string;
  is_active?: boolean;
  max_devices?: number;
  offline_days?: number;
  downloads_enabled?: boolean;
  books_count?: number;
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
  cover_thumbnail_url?: string | null;
  status: BookStatus;
  review_status?: BookReviewStatus;
  review_note?: string | null;
  copyright_note?: string | null;
  copyright_status: CopyrightStatus;
  language: string | null;
  publisher: string | null;
  publishing_house?: { id: string; name: string; slug: string } | null;
  imprint?: { id: string; name: string; slug: string } | null;
  publication_date: string | null;
  page_count: number | null;
  co_authors?: string[];
  categories: string[];
  tags: string[];
  age_rating?: string | null;
  edition?: string | null;
  series_name?: string | null;
  series_position?: number | null;
  isbn: string | null;
  file_format?: string | null;
  file_size?: number | null;
  has_file?: boolean;
  has_sample?: boolean;
  sample_pages?: number | null;
  views_count: number;
  clicks_count: number;
  purchases_count: number;
  is_free: boolean;
  rating_avg: number | string | null;
  ratings_count: number;
  is_single_sale_enabled: boolean;
  is_subscription_available: boolean;
  formats?: ApiBookFormat[];
  media_editions?: ApiMediaEdition[];
  subscription_plans?: ApiSubscriptionPlan[];
  published_at?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ApiLibraryEntry = {
  id: string;
  access_type: LibraryAccessType;
  status: "active" | "expired" | "revoked";
  purchased_at: string;
  expires_at: string | null;
  last_opened_at: string | null;
  reading_progress?: {
    locator: string | null;
    locator_type: string | null;
    progress_percent: number | string;
    updated_at: string | null;
  } | null;
  book: ApiBook;
  subscription?: ApiSubscription | null;
};

export type ApiOrderItem = {
  id: string;
  book_id: string;
  title: string | null;
  format_id: string | null;
  book_format: BookFormatType;
  price: number | string;
  currency_code: string;
  quantity: number;
};

export type ApiOrder = {
  id: string;
  total_price: number | string;
  currency_code: string;
  payment_status: OrderPaymentStatus;
  payment_provider: string | null;
  payment_channel: string | null;
  payment_verified_at: string | null;
  items: ApiOrderItem[];
  created_at: string;
};

export type ApiSubscription = {
  id: string;
  status: SubscriptionStatus;
  started_at: string;
  expires_at: string | null;
  plan?: ApiSubscriptionPlan | null;
};

export type ApiPagination<T> = {
  data: T[];
  links?: Record<string, unknown>;
  meta?: { current_page?: number; last_page?: number; per_page?: number; total?: number };
};
