import { createClient } from "@/lib/supabase/server";
import {
  ADMIN_DEFAULT_PAGE_SIZE,
  buildPagination,
  firstOf,
  getPaginationRange,
  normalizeSearchTerm,
  safeLikeTerm,
  type AdminAuthorMini,
  type AdminBookMini,
  type AdminProfileMini,
  type MaybeArray,
} from "@/lib/supabase/admin/shared";
import type { AdminNotice, AdminOption, AdminPagedResult } from "@/types/admin";
import type { BookFormatType } from "@/types/database";

type FormatRow = {
  id: string;
  book_id: string;
  format: BookFormatType;
  price: number;
  currency_code: string;
  downloadable: boolean;
  is_published: boolean;
  printing_cost: number | null;
  stock_quantity: number | null;
  file_size_mb: number | null;
  file_url: string | null;
  created_at: string;
  updated_at: string;
};

type RelatedBookRow = Pick<
  AdminBookMini,
  "id" | "title" | "status" | "author_id" | "cover_url" | "price" | "currency_code" | "is_subscription_available" | "is_single_sale_enabled"
> & {
  author_profile: MaybeArray<Pick<AdminAuthorMini, "id" | "display_name">>;
  author_profile_fallback: MaybeArray<Pick<AdminProfileMini, "id" | "name" | "email">>;
};

export type AdminFormatListItem = FormatRow & {
  book_title: string;
  book_status: string;
  author_name: string;
};

export type AdminFormatsPageData = AdminPagedResult<AdminFormatListItem> & {
  filterOptions: {
    formats: AdminOption[];
  };
  notices: AdminNotice[];
};

export type AdminFormatDetail = {
  format: FormatRow;
  book: RelatedBookRow & {
    author_name: string;
  };
  notices: AdminNotice[];
};

async function resolveFormatBookIds(search: string) {
  const supabase = await createClient();
  const term = safeLikeTerm(search);

  const [bookMatches, authorMatches, profileMatches] = await Promise.all([
    supabase.from("books").select("id").or(`title.ilike.%${term}%,subtitle.ilike.%${term}%`),
    supabase.from("author_profiles").select("id").or(`display_name.ilike.%${term}%,bio.ilike.%${term}%`),
    supabase.from("profiles").select("id").or(`name.ilike.%${term}%,email.ilike.%${term}%`),
  ]);

  const authorIds = new Set<string>();
  (authorMatches.data ?? []).forEach((item) => authorIds.add(item.id));
  (profileMatches.data ?? []).forEach((item) => authorIds.add(item.id));

  const matchingBookIds = new Set<string>();
  (bookMatches.data ?? []).forEach((item) => matchingBookIds.add(item.id));

  if (authorIds.size > 0) {
    const authorBooks = await supabase.from("books").select("id").in("author_id", Array.from(authorIds));
    (authorBooks.data ?? []).forEach((item) => matchingBookIds.add(item.id));
  }

  return Array.from(matchingBookIds);
}

export async function listAdminFormats(params: {
  page?: number;
  search?: string;
  format?: BookFormatType | "";
  publication?: string;
  stock?: string;
}): Promise<AdminFormatsPageData> {
  const supabase = await createClient();
  const page = params.page ?? 1;
  const search = normalizeSearchTerm(params.search);
  const { from, to } = getPaginationRange(page, ADMIN_DEFAULT_PAGE_SIZE);
  const notices: AdminNotice[] = [];
  const searchBookIds = search ? await resolveFormatBookIds(search) : null;

  let query = supabase
    .from("book_formats")
    .select("id, book_id, format, price, currency_code, downloadable, is_published, printing_cost, stock_quantity, file_size_mb, file_url, created_at, updated_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  if (params.format) {
    query = query.eq("format", params.format);
  }

  if (params.publication === "published") {
    query = query.eq("is_published", true);
  } else if (params.publication === "unpublished") {
    query = query.eq("is_published", false);
  }

  if (params.stock === "in_stock") {
    query = query.or("stock_quantity.is.null,stock_quantity.gt.0");
  } else if (params.stock === "out_of_stock") {
    query = query.eq("stock_quantity", 0);
  }

  if (search) {
    if (!searchBookIds?.length) {
      return {
        items: [],
        pagination: buildPagination(0, page, ADMIN_DEFAULT_PAGE_SIZE),
        filterOptions: {
          formats: [
            { label: "ebook", value: "ebook" },
            { label: "paperback", value: "paperback" },
            { label: "hardcover", value: "hardcover" },
            { label: "audiobook", value: "audiobook" },
          ],
        },
        notices,
      };
    }

    query = query.in("book_id", searchBookIds);
  }

  const { data, count, error } = await query.range(from, to).returns<FormatRow[]>();

  if (error) {
    return {
      items: [],
      pagination: buildPagination(0, page, ADMIN_DEFAULT_PAGE_SIZE),
      filterOptions: {
        formats: [],
      },
      notices: [
        {
          id: "formats-load-error",
          tone: "danger",
          title: "Impossible de charger les formats",
          description: error.message,
        },
      ],
    };
  }

  const rows = data ?? [];
  const bookIds = rows.map((row) => row.book_id);
  const relatedBooksResult =
    bookIds.length > 0
      ? await supabase
          .from("books")
          .select(
            "id, title, status, author_id, cover_url, price, currency_code, is_subscription_available, is_single_sale_enabled, author_profile:author_profiles!books_author_profile_id_fkey(id, display_name), author_profile_fallback:profiles!books_author_id_fkey(id, name, email)",
          )
          .in("id", bookIds)
          .returns<RelatedBookRow[]>()
      : { data: [] as RelatedBookRow[], error: null };

  const relatedBooksById = new Map<string, RelatedBookRow>();
  (relatedBooksResult.data ?? []).forEach((book) => {
    relatedBooksById.set(book.id, book);
  });

  return {
    items: rows.map((row) => {
      const book = relatedBooksById.get(row.book_id);
      return {
        ...row,
        book_title: book?.title ?? "Livre inconnu",
        book_status: book?.status ?? "unknown",
        author_name: firstOf(book?.author_profile)?.display_name ?? firstOf(book?.author_profile_fallback)?.name ?? "Auteur inconnu",
      };
    }),
    pagination: buildPagination(count, page, ADMIN_DEFAULT_PAGE_SIZE),
    filterOptions: {
      formats: [
        { label: "ebook", value: "ebook" },
        { label: "paperback", value: "paperback" },
        { label: "hardcover", value: "hardcover" },
        { label: "audiobook", value: "audiobook" },
      ],
    },
    notices,
  };
}

export async function getAdminFormatDetail(formatId: string): Promise<AdminFormatDetail | null> {
  const supabase = await createClient();
  const formatResult = await supabase
    .from("book_formats")
    .select("id, book_id, format, price, currency_code, downloadable, is_published, printing_cost, stock_quantity, file_size_mb, file_url, created_at, updated_at")
    .eq("id", formatId)
    .returns<FormatRow>()
    .maybeSingle();

  const format = (formatResult.data ?? null) as FormatRow | null;

  if (!format) {
    return null;
  }

  const bookResult = await supabase
    .from("books")
    .select(
      "id, title, status, author_id, cover_url, price, currency_code, is_subscription_available, is_single_sale_enabled, author_profile:author_profiles!books_author_profile_id_fkey(id, display_name), author_profile_fallback:profiles!books_author_id_fkey(id, name, email)",
    )
    .eq("id", format.book_id)
    .returns<RelatedBookRow>()
    .maybeSingle();

  const book = (bookResult.data ?? null) as RelatedBookRow | null;

  if (!book) {
    return null;
  }

  return {
    format,
    book: {
      ...book,
      author_name: firstOf(book.author_profile)?.display_name ?? firstOf(book.author_profile_fallback)?.name ?? "Auteur inconnu",
    },
    notices: [],
  };
}

export async function getAdminFormatEditorOptions() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("books")
    .select(
      "id, title, status, author_id, cover_url, price, currency_code, is_subscription_available, is_single_sale_enabled, author_profile:author_profiles!books_author_profile_id_fkey(id, display_name), author_profile_fallback:profiles!books_author_id_fkey(id, name, email)",
    )
    .order("created_at", { ascending: false })
    .returns<RelatedBookRow[]>();

  return {
    books: (data ?? []).map((book) => ({
      label: `${book.title} - ${firstOf(book.author_profile)?.display_name ?? firstOf(book.author_profile_fallback)?.name ?? "Auteur inconnu"}`,
      value: book.id,
    })),
  };
}
