export type UserRole = "reader" | "author" | "admin";
export type BookStatus = "draft" | "published" | "archived" | "coming_soon";
export type BookReviewStatus = "draft" | "submitted" | "approved" | "rejected" | "changes_requested";
export type BookFormatType = "ebook" | "paperback" | "hardcover" | "audiobook";
export type BookEngagementEventType = "detail_view" | "reader_open" | "file_access";
export type LibraryAccessType = "purchase" | "subscription" | "free";
export type SubscriptionStatus = "active" | "cancelled" | "expired" | "past_due";
export type OrderPaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          role: UserRole;
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          country: string | null;
          city: string | null;
          preferred_language: string;
          favorite_categories: string[];
          marketing_opt_in: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          role?: UserRole;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          country?: string | null;
          city?: string | null;
          preferred_language?: string;
          favorite_categories?: string[];
          marketing_opt_in?: boolean;
          created_at?: string;
        };
        Update: {
          email?: string;
          name?: string | null;
          role?: UserRole;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          country?: string | null;
          city?: string | null;
          preferred_language?: string;
          favorite_categories?: string[];
          marketing_opt_in?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "author_profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "author_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "books_author_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["author_id"];
          },
          {
            foreignKeyName: "book_engagement_events_user_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "book_engagement_events";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "highlights_user_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "highlights";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "library_user_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "library";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "orders_user_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "ratings_user_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "ratings";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "user_subscriptions_user_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "user_subscriptions";
            referencedColumns: ["user_id"];
          },
        ];
      };
      author_profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          bio: string | null;
          website: string | null;
          location: string | null;
          professional_headline: string | null;
          phone: string | null;
          genres: string[];
          publishing_goals: string | null;
          social_links: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          avatar_url?: string | null;
          bio?: string | null;
          website?: string | null;
          location?: string | null;
          professional_headline?: string | null;
          phone?: string | null;
          genres?: string[];
          publishing_goals?: string | null;
          social_links?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          website?: string | null;
          location?: string | null;
          professional_headline?: string | null;
          phone?: string | null;
          genres?: string[];
          publishing_goals?: string | null;
          social_links?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "author_profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "books_author_profile_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["author_id"];
          },
        ];
      };
      blog_posts: {
        Row: {
          id: string;
          slug: string;
          title: string;
          excerpt: string;
          tag: string;
          author: string;
          read_time: string;
          cover_label: string;
          cover_image_url: string | null;
          cover_image_alt: string | null;
          published_at: string;
          content_blocks: Record<string, unknown>[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          excerpt: string;
          tag: string;
          author: string;
          read_time: string;
          cover_label?: string;
          cover_image_url?: string | null;
          cover_image_alt?: string | null;
          published_at?: string;
          content_blocks?: Record<string, unknown>[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          excerpt?: string;
          tag?: string;
          author?: string;
          read_time?: string;
          cover_label?: string;
          cover_image_url?: string | null;
          cover_image_alt?: string | null;
          published_at?: string;
          content_blocks?: Record<string, unknown>[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      flash_sale_configs: {
        Row: {
          scope: string;
          selected_book_ids: string[];
          discount_percentage: number;
          updated_at: string;
        };
        Insert: {
          scope?: string;
          selected_book_ids?: string[];
          discount_percentage?: number;
          updated_at?: string;
        };
        Update: {
          scope?: string;
          selected_book_ids?: string[];
          discount_percentage?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      books: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          price: number;
          author_id: string;
          cover_url: string | null;
          file_url: string | null;
          status: BookStatus;
          created_at: string;
          subtitle: string | null;
          co_authors: string[];
          isbn: string | null;
          language: string;
          publisher: string | null;
          publication_date: string | null;
          page_count: number | null;
          categories: string[];
          tags: string[];
          age_rating: string | null;
          edition: string | null;
          series_name: string | null;
          series_position: number | null;
          file_format: string | null;
          file_size: number | null;
          sample_url: string | null;
          sample_pages: number | null;
          cover_thumbnail_url: string | null;
          cover_alt_text: string | null;
          updated_at: string;
          published_at: string | null;
          views_count: number;
          purchases_count: number;
          rating_avg: number | null;
          ratings_count: number;
          currency_code: string;
          is_single_sale_enabled: boolean;
          is_subscription_available: boolean;
          review_status: BookReviewStatus;
          submitted_at: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          review_note: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          price: number;
          author_id: string;
          cover_url?: string | null;
          file_url?: string | null;
          status?: BookStatus;
          created_at?: string;
          subtitle?: string | null;
          co_authors?: string[];
          isbn?: string | null;
          language?: string;
          publisher?: string | null;
          publication_date?: string | null;
          page_count?: number | null;
          categories?: string[];
          tags?: string[];
          age_rating?: string | null;
          edition?: string | null;
          series_name?: string | null;
          series_position?: number | null;
          file_format?: string | null;
          file_size?: number | null;
          sample_url?: string | null;
          sample_pages?: number | null;
          cover_thumbnail_url?: string | null;
          cover_alt_text?: string | null;
          updated_at?: string;
          published_at?: string | null;
          views_count?: number;
          purchases_count?: number;
          rating_avg?: number | null;
          ratings_count?: number;
          currency_code?: string;
          is_single_sale_enabled?: boolean;
          is_subscription_available?: boolean;
          review_status?: BookReviewStatus;
          submitted_at?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          review_note?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          price?: number;
          author_id?: string;
          cover_url?: string | null;
          file_url?: string | null;
          status?: BookStatus;
          created_at?: string;
          subtitle?: string | null;
          co_authors?: string[];
          isbn?: string | null;
          language?: string;
          publisher?: string | null;
          publication_date?: string | null;
          page_count?: number | null;
          categories?: string[];
          tags?: string[];
          age_rating?: string | null;
          edition?: string | null;
          series_name?: string | null;
          series_position?: number | null;
          file_format?: string | null;
          file_size?: number | null;
          sample_url?: string | null;
          sample_pages?: number | null;
          cover_thumbnail_url?: string | null;
          cover_alt_text?: string | null;
          updated_at?: string;
          published_at?: string | null;
          views_count?: number;
          purchases_count?: number;
          rating_avg?: number | null;
          ratings_count?: number;
          currency_code?: string;
          is_single_sale_enabled?: boolean;
          is_subscription_available?: boolean;
          review_status?: BookReviewStatus;
          submitted_at?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          review_note?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "book_formats_book_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "book_formats";
            referencedColumns: ["book_id"];
          },
          {
            foreignKeyName: "book_engagement_events_book_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "book_engagement_events";
            referencedColumns: ["book_id"];
          },
          {
            foreignKeyName: "books_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "books_author_profile_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "author_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "books_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "highlights_book_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "highlights";
            referencedColumns: ["book_id"];
          },
          {
            foreignKeyName: "library_book_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "library";
            referencedColumns: ["book_id"];
          },
          {
            foreignKeyName: "order_items_book_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "order_items";
            referencedColumns: ["book_id"];
          },
          {
            foreignKeyName: "ratings_book_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "ratings";
            referencedColumns: ["book_id"];
          },
          {
            foreignKeyName: "subscription_plan_books_book_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "subscription_plan_books";
            referencedColumns: ["book_id"];
          },
        ];
      };
      book_formats: {
        Row: {
          id: string;
          book_id: string;
          format: BookFormatType;
          price: number;
          file_url: string | null;
          stock_quantity: number | null;
          file_size_mb: number | null;
          downloadable: boolean;
          is_published: boolean;
          printing_cost: number | null;
          created_at: string;
          updated_at: string;
          currency_code: string;
        };
        Insert: {
          id?: string;
          book_id: string;
          format: BookFormatType;
          price: number;
          file_url?: string | null;
          stock_quantity?: number | null;
          file_size_mb?: number | null;
          downloadable?: boolean;
          is_published?: boolean;
          printing_cost?: number | null;
          created_at?: string;
          updated_at?: string;
          currency_code?: string;
        };
        Update: {
          id?: string;
          book_id?: string;
          format?: BookFormatType;
          price?: number;
          file_url?: string | null;
          stock_quantity?: number | null;
          file_size_mb?: number | null;
          downloadable?: boolean;
          is_published?: boolean;
          printing_cost?: number | null;
          created_at?: string;
          updated_at?: string;
          currency_code?: string;
        };
        Relationships: [
          {
            foreignKeyName: "book_formats_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
        ];
      };
      book_engagement_events: {
        Row: {
          id: string;
          book_id: string;
          user_id: string | null;
          event_type: BookEngagementEventType;
          source: string | null;
          user_role: UserRole | null;
          is_authenticated: boolean;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          book_id: string;
          user_id?: string | null;
          event_type: BookEngagementEventType;
          source?: string | null;
          user_role?: UserRole | null;
          is_authenticated?: boolean;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          book_id?: string;
          user_id?: string | null;
          event_type?: BookEngagementEventType;
          source?: string | null;
          user_role?: UserRole | null;
          is_authenticated?: boolean;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "book_engagement_events_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "book_engagement_events_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      highlights: {
        Row: {
          id: string;
          user_id: string;
          book_id: string;
          page: number;
          text: string | null;
          note: string | null;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          book_id: string;
          page: number;
          text?: string | null;
          note?: string | null;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          book_id?: string;
          page?: number;
          text?: string | null;
          note?: string | null;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "highlights_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "highlights_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      library: {
        Row: {
          id: string;
          user_id: string;
          book_id: string;
          purchased_at: string;
          access_type: LibraryAccessType;
          subscription_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          book_id: string;
          purchased_at?: string;
          access_type?: LibraryAccessType;
          subscription_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          book_id?: string;
          purchased_at?: string;
          access_type?: LibraryAccessType;
          subscription_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "library_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "library_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "user_subscriptions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "library_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          total_price: number;
          payment_status: OrderPaymentStatus;
          created_at: string;
          currency_code: string;
          payment_provider: string | null;
          payment_transaction_id: string | null;
          payment_channel: string | null;
          payment_provider_status: string | null;
          payment_verified_at: string | null;
          payment_metadata: Record<string, unknown>;
        };
        Insert: {
          id?: string;
          user_id: string;
          total_price: number;
          payment_status?: OrderPaymentStatus;
          created_at?: string;
          currency_code?: string;
          payment_provider?: string | null;
          payment_transaction_id?: string | null;
          payment_channel?: string | null;
          payment_provider_status?: string | null;
          payment_verified_at?: string | null;
          payment_metadata?: Record<string, unknown>;
        };
        Update: {
          id?: string;
          user_id?: string;
          total_price?: number;
          payment_status?: OrderPaymentStatus;
          created_at?: string;
          currency_code?: string;
          payment_provider?: string | null;
          payment_transaction_id?: string | null;
          payment_channel?: string | null;
          payment_provider_status?: string | null;
          payment_verified_at?: string | null;
          payment_metadata?: Record<string, unknown>;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "order_items";
            referencedColumns: ["order_id"];
          },
          {
            foreignKeyName: "orders_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          book_id: string;
          price: number;
          currency_code: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          book_id: string;
          price: number;
          currency_code?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          book_id?: string;
          price?: number;
          currency_code?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      ratings: {
        Row: {
          id: string;
          user_id: string;
          book_id: string;
          rating: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          book_id: string;
          rating: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          book_id?: string;
          rating?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ratings_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ratings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      subscription_plans: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          monthly_price: number;
          currency_code: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          monthly_price: number;
          currency_code?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          monthly_price?: number;
          currency_code?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscription_plan_books_plan_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "subscription_plan_books";
            referencedColumns: ["plan_id"];
          },
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "user_subscriptions";
            referencedColumns: ["plan_id"];
          },
        ];
      };
      subscription_plan_books: {
        Row: {
          id: string;
          plan_id: string;
          book_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          book_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          plan_id?: string;
          book_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscription_plan_books_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscription_plan_books_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "subscription_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      user_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          status: SubscriptionStatus;
          started_at: string;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id: string;
          status: SubscriptionStatus;
          started_at?: string;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_id?: string;
          status?: SubscriptionStatus;
          started_at?: string;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "library_subscription_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "library";
            referencedColumns: ["subscription_id"];
          },
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "subscription_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_current_user_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      track_book_engagement: {
        Args: {
          p_book_id: string;
          p_event_type: BookEngagementEventType;
          p_source?: string | null;
          p_metadata?: Record<string, unknown>;
        };
        Returns: undefined;
      };
      user_has_access_to_book: {
        Args: {
          p_user_id: string;
          p_book_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
