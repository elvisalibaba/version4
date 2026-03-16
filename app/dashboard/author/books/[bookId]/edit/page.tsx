import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Library } from "lucide-react";
import { PublishLabForm, buildOptionalFormatState } from "@/components/author/publish-lab-form";
import { DashboardTopbar } from "@/components/ui/dashboard-topbar";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { BookFormatType, Database } from "@/types/database";

type MaybeArray<T> = T | T[] | null;

type EditableBookRow = Pick<
  Database["public"]["Tables"]["books"]["Row"],
  | "id"
  | "title"
  | "subtitle"
  | "description"
  | "isbn"
  | "language"
  | "publisher"
  | "publication_date"
  | "page_count"
  | "co_authors"
  | "categories"
  | "tags"
  | "age_rating"
  | "edition"
  | "series_name"
  | "series_position"
  | "cover_alt_text"
  | "sample_pages"
  | "status"
  | "published_at"
  | "price"
  | "file_format"
  | "file_size"
  | "cover_url"
  | "cover_thumbnail_url"
  | "file_url"
  | "sample_url"
  | "is_single_sale_enabled"
  | "is_subscription_available"
  | "review_status"
  | "submitted_at"
  | "reviewed_at"
  | "review_note"
> & {
  author: MaybeArray<{ display_name: string | null }>;
  book_formats:
    | {
        format: BookFormatType;
        price: number;
        stock_quantity: number | null;
        downloadable: boolean;
        is_published: boolean;
        printing_cost: number | null;
        file_size_mb: number | null;
        file_url: string | null;
      }[]
    | null;
  subscription_plan_books: { plan_id: string }[] | null;
};

type SubscriptionPlanRow = Pick<
  Database["public"]["Tables"]["subscription_plans"]["Row"],
  "id" | "name" | "slug" | "description" | "monthly_price" | "currency_code" | "is_active"
>;

type PageProps = {
  params: Promise<{ bookId: string }>;
};

function firstOf<T>(value: MaybeArray<T>) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function EditAuthorBookPage({ params }: PageProps) {
  const { bookId } = await params;
  const profile = await requireRole(["author"]);
  const supabase = await createClient();

  const [{ data: bookData }, { data: subscriptionPlans }] = await Promise.all([
    supabase
      .from("books")
      .select(
        "id, title, subtitle, description, isbn, language, publisher, publication_date, page_count, co_authors, categories, tags, age_rating, edition, series_name, series_position, cover_alt_text, sample_pages, price, file_format, file_size, cover_url, cover_thumbnail_url, file_url, sample_url, is_single_sale_enabled, is_subscription_available, review_status, submitted_at, reviewed_at, review_note, author:author_profiles!books_author_profile_id_fkey(display_name), book_formats(format, price, stock_quantity, downloadable, is_published, printing_cost, file_size_mb, file_url), subscription_plan_books(plan_id)",
      )
      .eq("id", bookId)
      .eq("author_id", profile.id)
      .returns<EditableBookRow>()
      .maybeSingle(),
    supabase
      .from("subscription_plans")
      .select("id, name, slug, description, monthly_price, currency_code, is_active")
      .eq("is_active", true)
      .order("monthly_price", { ascending: true })
      .returns<SubscriptionPlanRow[]>(),
  ]);

  const book = (bookData ?? null) as EditableBookRow | null;

  if (!book) {
    notFound();
  }

  const formats = book.book_formats ?? [];
  const ebookFormat = formats.find((format) => format.format === "ebook");

  return (
    <section className="space-y-6">
      <DashboardTopbar
        kicker="Author studio"
        title={`Modifier "${book.title}"`}
        description="Ajustez les metadonnees, les formats et la disponibilite Premium avant une nouvelle revue admin."
        actions={
          <>
            <Link href="/dashboard/author/books" className="cta-primary px-5 py-3 text-sm">
              <ArrowLeft className="h-4 w-4" />
              Retour au catalogue
            </Link>
            <Link href="/dashboard/author" className="cta-secondary px-5 py-3 text-sm">
              <Library className="h-4 w-4" />
              Tableau de bord
            </Link>
          </>
        }
      />

      <div className="surface-panel p-4 sm:p-6">
        <PublishLabForm
          subscriptionPlans={(subscriptionPlans ?? []) as SubscriptionPlanRow[]}
          initialValues={{
            id: book.id,
            title: book.title,
            authorFullName: firstOf(book.author)?.display_name ?? profile.name ?? "",
            subtitle: book.subtitle ?? "",
            description: book.description ?? "",
            isbn: book.isbn ?? "",
            language: book.language,
            publisher: book.publisher ?? "",
            publicationDate: book.publication_date ?? "",
            pageCount: book.page_count ? String(book.page_count) : "",
            coAuthors: book.co_authors.join(", "),
            selectedCategory: book.categories[0] ?? "",
            tags: book.tags.join(", "),
            ageRating: book.age_rating ?? "",
            edition: book.edition ?? "",
            seriesName: book.series_name ?? "",
            seriesPosition: book.series_position ? String(book.series_position) : "",
            coverAltText: book.cover_alt_text ?? "",
            samplePages: book.sample_pages ? String(book.sample_pages) : "",
            ebookPrice: String(ebookFormat?.price ?? book.price),
            ebookDownloadable: false,
            ebookFileSizeMb: ebookFormat?.file_size_mb ?? (book.file_size ? Math.ceil(book.file_size / (1024 * 1024)) : null),
            ebookStoredFileSize: book.file_size,
            ebookFileFormat: book.file_format,
            paperback: buildOptionalFormatState(formats.find((format) => format.format === "paperback")),
            hardcover: buildOptionalFormatState(formats.find((format) => format.format === "hardcover")),
            audiobook: buildOptionalFormatState(formats.find((format) => format.format === "audiobook")),
            coverPath: book.cover_url,
            coverThumbnailUrl: book.cover_thumbnail_url,
            ebookPath: ebookFormat?.file_url ?? book.file_url,
            samplePath: book.sample_url,
            isSingleSaleEnabled: book.is_single_sale_enabled,
            isSubscriptionAvailable: book.is_subscription_available,
            selectedPlanIds: (book.subscription_plan_books ?? []).map((plan) => plan.plan_id),
            reviewStatus: book.review_status,
            submittedAt: book.submitted_at,
            reviewedAt: book.reviewed_at,
            reviewNote: book.review_note,
          }}
        />
      </div>
    </section>
  );
}
