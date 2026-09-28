import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PublishLabForm } from "@/components/author/publish-lab-form";
import { DashboardTopbar } from "@/components/ui/dashboard-topbar";
import { apiServer } from "@/lib/api/server";
import { requireRole } from "@/lib/auth";
import { getSubscriptionPlans } from "@/lib/author-api";
import type { ApiBook, BookReviewStatus } from "@/types/api";

type PageProps = {
  params: Promise<{ bookId: string }>;
};

export default async function EditAuthorBookPage({ params }: PageProps) {
  const { bookId } = await params;
  const profile = await requireRole(["author"]);
  const [response, subscriptionPlans] = await Promise.all([
    apiServer<{ data: ApiBook }>(`books/${encodeURIComponent(bookId)}`),
    getSubscriptionPlans(),
  ]);

  const book = response.data;
  if (!book || book.author_id !== profile.id) notFound();

  return (
    <section className="space-y-6">
      <DashboardTopbar
        kicker="Publication"
        title={`Modifier « ${book.title} »`}
        description="Mettez à jour les métadonnées, le fichier numérique et les options commerciales depuis l’API Laravel."
        actions={
          <Link href="/dashboard/author/books" className="cta-secondary px-5 py-3 text-sm">
            <ArrowLeft className="h-4 w-4" /> Mes livres
          </Link>
        }
      />

      <div className="rounded-[28px] border border-[#ded3c2] bg-white p-4 sm:p-6">
        <PublishLabForm
          subscriptionPlans={subscriptionPlans}
          initialValues={{
            id: book.id,
            title: book.title,
            authorFullName: book.author_display_name ?? profile.name ?? "",
            subtitle: book.subtitle ?? "",
            description: book.description ?? "",
            isbn: book.isbn ?? "",
            language: book.language ?? "fr",
            publisher: book.publisher ?? "",
            publicationDate: book.publication_date ?? "",
            pageCount: book.page_count ? String(book.page_count) : "",
            coAuthors: (book.co_authors ?? []).join(", "),
            selectedCategory: book.categories?.[0] ?? "",
            tags: (book.tags ?? []).join(", "),
            ageRating: book.age_rating ?? "",
            edition: book.edition ?? "",
            seriesName: book.series_name ?? "",
            seriesPosition: book.series_position ? String(book.series_position) : "",
            coverAltText: book.cover_alt_text ?? "",
            samplePages: book.sample_pages ? String(book.sample_pages) : "",
            ebookPrice: String(book.price ?? 0),
            ebookPath: book.has_file ? "__existing_private_file__" : null,
            coverPath: book.cover_url,
            isSingleSaleEnabled: book.is_single_sale_enabled,
            isSubscriptionAvailable: book.is_subscription_available,
            selectedPlanIds: (book.subscription_plans ?? []).map((plan) => plan.id),
            reviewStatus: (book.review_status ?? "draft") as BookReviewStatus,
            submittedAt: book.submitted_at ?? null,
            reviewedAt: book.reviewed_at ?? null,
            reviewNote: book.review_note ?? null,
          }}
        />
      </div>
    </section>
  );
}
