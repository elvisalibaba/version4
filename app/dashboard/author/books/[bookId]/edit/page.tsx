import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PublishLabForm } from "@/components/author/publish-lab-form";
import { DashboardTopbar } from "@/components/ui/dashboard-topbar";
import { requireRole } from "@/lib/auth";
import { getAuthorBook, getSubscriptionPlans } from "@/lib/author-api";
import type { BookReviewStatus } from "@/types/api";

type PageProps = {
  params: Promise<{ bookId: string }>;
};

export default async function EditAuthorBookPage({ params }: PageProps) {
  const { bookId } = await params;
  const profile = await requireRole(["author"]);
  const [book, subscriptionPlans] = await Promise.all([
    getAuthorBook(bookId).catch(() => null),
    getSubscriptionPlans(),
  ]);

  if (!book || book.author_id !== profile.id) notFound();

  return (
    <section className="space-y-6">
      <DashboardTopbar
        kicker="Publication"
        title={`Modifier « ${book.title} »`}
        description="Mettez à jour les informations, le fichier et les options de vente de votre livre."
        actions={
          <Link href="/dashboard/author/books" className="cta-secondary px-5 py-3 text-sm">
            <ArrowLeft className="h-4 w-4" /> Mes livres
          </Link>
        }
      />

      <div className="rounded-xl border border-slate-300 bg-white p-4 sm:p-6">
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
            writingStatus: book.author_workspace?.writing_status ?? "idea",
            targetWordCount: book.author_workspace?.target_word_count ? String(book.author_workspace.target_word_count) : "",
            currentWordCount: book.author_workspace?.current_word_count ? String(book.author_workspace.current_word_count) : "",
            nextAuthorAction: book.author_workspace?.next_author_action ?? "",
            editorialDeadline: book.author_workspace?.editorial_deadline ?? "",
            authorPrivateNotes: book.author_workspace?.author_private_notes ?? "",
          }}
        />
      </div>

      <section className="rounded-xl border border-slate-300 bg-slate-50 p-5 sm:p-6">
        <p className="text-xs font-bold text-brand-600">Droits de lecture appliqués par Holistique Books</p>
        <h2 className="mt-2 font-bold text-2xl text-night-900">Licence et protection du titre</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Ces paramètres proviennent du contrat éditorial et ne sont pas modifiables depuis le Studio Auteur.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Lecture plateforme", book.reader_rights?.can_read_on_platform ? "Autorisée" : "Bloquée"],
            ["Téléchargement", "Interdit"],
            ["Impression", book.reader_rights?.allow_print ? "Autorisée" : "Interdite"],
            ["Copie", book.reader_rights?.allow_copy ? "Autorisée" : "Interdite"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-bold text-slate-500">{label}</p>
              <p className="mt-2 font-semibold text-night-900">{value}</p>
            </div>
          ))}
        </div>
        {book.reader_rights?.rights_agreement_reference ? (
          <p className="mt-4 text-sm text-slate-600">Référence accord : <strong>{book.reader_rights.rights_agreement_reference}</strong></p>
        ) : null}
      </section>
    </section>
  );
}
