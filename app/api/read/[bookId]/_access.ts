import { getBlockedAccessMessage, getReaderBookAccessState, syncLibraryAccessEntry } from "@/lib/book-access";
import { isBookCopyrightBlocked } from "@/lib/book-copyright";
import { DIGITAL_BOOK_FORMATS, findPreferredFormat } from "@/lib/book-formats";
import { createClient } from "@/lib/supabase/server";
import type { BookFormatType, Database } from "@/types/database";

type FileType = "epub" | "pdf";

export type ReadAccessResult =
  | { ok: true; filePath: string; fileType: FileType }
  | { ok: false; status: number; error: string };

type BookWithFormats = Pick<
  Database["public"]["Tables"]["books"]["Row"],
  "id" | "file_url" | "price" | "status" | "copyright_status" | "is_single_sale_enabled" | "is_subscription_available"
> & {
  book_formats?: {
    format: BookFormatType;
    file_url: string | null;
    price: number;
    is_published: boolean;
    currency_code: string;
  }[] | null;
  subscription_plan_books?: { plan_id: string }[] | null;
};

function getFileType(path: string): FileType | null {
  const lower = path.toLowerCase();
  if (lower.endsWith(".epub")) return "epub";
  if (lower.endsWith(".pdf")) return "pdf";
  return null;
}

export async function resolveReadAccess(bookId: string, userId: string): Promise<ReadAccessResult> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("books")
    .select(
      "id, file_url, price, status, copyright_status, is_single_sale_enabled, is_subscription_available, book_formats!left(format, file_url, price, is_published, currency_code), subscription_plan_books!left(plan_id)",
    )
    .eq("id", bookId)
    .eq("status", "published")
    .returns<BookWithFormats>()
    .maybeSingle();

  const book = (data ?? null) as BookWithFormats | null;

  if (!book || book.status !== "published") {
    return { ok: false, status: 404, error: "Livre introuvable." };
  }

  if (isBookCopyrightBlocked(book.copyright_status)) {
    return { ok: false, status: 403, error: "La lecture est suspendue sur ce livre pour verification de droits d auteur." };
  }

  const digitalFormat = findPreferredFormat(
    (book.book_formats ?? []).filter((format) => format.is_published && DIGITAL_BOOK_FORMATS.includes(format.format as (typeof DIGITAL_BOOK_FORMATS)[number])),
    DIGITAL_BOOK_FORMATS,
  );
  const effectivePrice = digitalFormat?.price ?? book.price ?? 0;
  const accessState = await getReaderBookAccessState({
    userId,
    bookId,
    bookPlanIds: (book.subscription_plan_books ?? []).map((entry) => entry.plan_id),
    supabase,
  });

  if (!accessState.hasAccess) {
    return {
      ok: false,
      status: 403,
      error: getBlockedAccessMessage({
        isSingleSaleEnabled: book.is_single_sale_enabled,
        isSubscriptionAvailable: book.is_subscription_available,
      }),
    };
  }

  await syncLibraryAccessEntry({
    userId,
    bookId,
    currentEntry: accessState.libraryEntry,
    activeSubscriptionId: accessState.activeSubscription?.id ?? null,
    shouldGrantFreeAccess: book.is_single_sale_enabled && effectivePrice <= 0,
    supabase,
  });

  const secureFilePath = digitalFormat?.file_url ?? book.file_url;
  if (!secureFilePath) {
    return { ok: false, status: 404, error: "Aucun fichier lisible disponible." };
  }

  const fileType = getFileType(secureFilePath);
  if (!fileType) {
    return { ok: false, status: 400, error: "Type de fichier non supporte." };
  }

  return { ok: true, filePath: secureFilePath, fileType };
}
