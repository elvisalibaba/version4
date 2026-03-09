export type UserRole = "reader" | "author" | "admin";
export type BookStatus = "draft" | "published" | "archived";
export type BookFormatType = "ebook" | "paperback" | "hardcover" | "audiobook";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          role?: UserRole;
          created_at?: string;
        };
        Update: {
          email?: string;
          name?: string | null;
          role?: UserRole;
        };
      };
      books: {
        Row: {
          id: string;
          title: string;
          subtitle: string | null;
          description: string | null;
          price: number;
          author_id: string;
          co_authors: string[];
          isbn: string | null;
          language: string;
          publisher: string | null;
          publication_date: string | null;
          page_count: number | null;
          cover_url: string | null;
          categories: string[];
          tags: string[];
          age_rating: string | null;
          edition: string | null;
          series_name: string | null;
          series_position: number | null;
          file_url: string;
          file_format: string | null;
          file_size: number | null;
          sample_url: string | null;
          sample_pages: number | null;
          cover_thumbnail_url: string | null;
          cover_alt_text: string | null;
          status: BookStatus;
          created_at: string;
          updated_at: string;
          published_at: string | null;
          views_count: number;
          purchases_count: number;
          rating_avg: number | null;
          ratings_count: number;
        };
        Insert: {
          title: string;
          subtitle?: string | null;
          description?: string | null;
          price: number;
          author_id: string;
          co_authors?: string[];
          isbn?: string | null;
          language?: string;
          publisher?: string | null;
          publication_date?: string | null;
          page_count?: number | null;
          cover_url?: string | null;
          categories?: string[];
          tags?: string[];
          age_rating?: string | null;
          edition?: string | null;
          series_name?: string | null;
          series_position?: number | null;
          file_url: string;
          file_format?: string | null;
          file_size?: number | null;
          sample_url?: string | null;
          sample_pages?: number | null;
          cover_thumbnail_url?: string | null;
          cover_alt_text?: string | null;
          status?: BookStatus;
          published_at?: string | null;
          views_count?: number;
          purchases_count?: number;
          rating_avg?: number | null;
          ratings_count?: number;
        };
        Update: {
          title?: string;
          subtitle?: string | null;
          description?: string | null;
          price?: number;
          co_authors?: string[];
          isbn?: string | null;
          language?: string;
          publisher?: string | null;
          publication_date?: string | null;
          page_count?: number | null;
          cover_url?: string | null;
          categories?: string[];
          tags?: string[];
          age_rating?: string | null;
          edition?: string | null;
          series_name?: string | null;
          series_position?: number | null;
          file_url?: string;
          file_format?: string | null;
          file_size?: number | null;
          sample_url?: string | null;
          sample_pages?: number | null;
          cover_thumbnail_url?: string | null;
          cover_alt_text?: string | null;
          status?: BookStatus;
          published_at?: string | null;
          views_count?: number;
          purchases_count?: number;
          rating_avg?: number | null;
          ratings_count?: number;
          updated_at?: string;
        };
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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          book_id: string;
          format: BookFormatType;
          price: number;
          file_url?: string | null;
          stock_quantity?: number | null;
          file_size_mb?: number | null;
          downloadable?: boolean;
          is_published?: boolean;
        };
        Update: {
          format?: BookFormatType;
          price?: number;
          file_url?: string | null;
          stock_quantity?: number | null;
          file_size_mb?: number | null;
          downloadable?: boolean;
          is_published?: boolean;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          total_price: number;
          payment_status: string;
          created_at: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          book_id: string;
          price: number;
        };
      };
      library: {
        Row: {
          id: string;
          user_id: string;
          book_id: string;
          purchased_at: string;
        };
      };
    };
  };
};
