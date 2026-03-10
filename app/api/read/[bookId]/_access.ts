import { createClient } from "@/lib/supabase/server";
import type { BookFormatType, Database } from "@/types/database";

type FileType = "epub" | "pdf";

export type ReadAccessResult =
  | { ok: true; filePath: string; fileType: FileType }
  | { ok: false; status: number; error: string };

type BookWithFormats =
  Database["public"]["Tables"]["books"]["Row"] & {
    book_formats?: {
      format: BookFormatType;
      file_url: string | null;
      price: number;
      is_published: boolean;
    }[];
  };

function getFileType(path: string): FileType | null {
  const lower = path.toLowerCase();
  if (lower.endsWith(".epub")) return "epub";
  if (lower.endsWith(".pdf")) return "pdf";
  return null;
}

export async function resolveReadAccess(bookId: string, userId: string): Promise<ReadAccessResult> {
  const supabase = await createClient();

  // SWC type checker on Vercel can sometimes lose generics; force the shape explicitly.
  const { data } = await supabase
    .from("books")
    .select("id, file_url, price, status, book_formats!left(format, file_url, price, is_published)")
    .eq("id", bookId)
    .eq("status", "published")
    .returns<BookWithFormats>()
    .maybeSingle();

  const book = (data ?? null) as BookWithFormats | null;

  if (!book || book.status !== "published") {
    return { ok: false, status: 404, error: "Livre introuvable." };
  }

  const ebookFormat = (book.book_formats ?? []).find((fmt) => fmt.format === "ebook" && fmt.is_published);
  const effectivePrice = ebookFormat?.price ?? book.price ?? 0;

  if (effectivePrice > 0) {
    const { data: libraryRow } = await supabase
      .from("library")
      .select("id")
      .eq("user_id", userId)
      .eq("book_id", bookId)
      .maybeSingle();

    if (!libraryRow) {
      return { ok: false, status: 403, error: "Achat requis pour lire ce livre." };
    }
  } else {
    const libraryEntry = { user_id: userId, book_id: bookId } as Database["public"]["Tables"]["library"]["Insert"];
    await supabase.from("library").upsert(libraryEntry, { onConflict: "user_id,book_id" });
  }

  const secureFilePath = ebookFormat?.file_url ?? book.file_url;
  if (!secureFilePath) {
    return { ok: false, status: 404, error: "Aucun fichier lisible disponible." };
  }

  const fileType = getFileType(secureFilePath);
  if (!fileType) {
    return { ok: false, status: 400, error: "Type de fichier non supporte." };
  }

  return { ok: true, filePath: secureFilePath, fileType };
}
