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
        Relationships: [
          {
            foreignKeyName: "books_author_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["author_id"];
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
        ];
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
        Relationships: [
          {
            foreignKeyName: "books_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "book_formats_book_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "book_formats";
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
      orders: {
        Row: {
          id: string;
          user_id: string;
          total_price: number;
          payment_status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          total_price: number;
          payment_status: string;
          created_at?: string;
        };
        Update: {
          total_price?: number;
          payment_status?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "order_items";
            referencedColumns: ["order_id"];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          book_id: string;
          price: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          book_id: string;
          price: number;
        };
        Update: {
          order_id?: string;
          book_id?: string;
          price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
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
        };
        Insert: {
          id?: string;
          user_id: string;
          book_id: string;
          purchased_at?: string;
        };
        Update: {
          user_id?: string;
          book_id?: string;
          purchased_at?: string;
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
            foreignKeyName: "library_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
