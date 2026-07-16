"use client";

import { useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { SubscriptionPlanSelector } from "@/components/author/subscription-plan-selector";
import { FormSection } from "@/components/ui/form-section";
import { BOOK_CATEGORIES } from "@/lib/book-categories";
import { getBookFormatLabel, isPhysicalBookFormat } from "@/lib/book-formats";
import { initialOptionalFormat, type PublishLabFormatState } from "@/lib/publish-lab";
import { getSupabaseBrowserConfigErrorMessage, getSupabaseBrowserErrorMessage } from "@/lib/supabase/browser-errors";
import { createClient } from "@/lib/supabase/client";
import type { BookFormatType, BookReviewStatus, Database } from "@/types/database";

type OptionalFormat = "holistique_store" | "paperback" | "pocket" | "hardcover" | "audiobook";

type FormatState = PublishLabFormatState;

type SubmissionIntent = "draft" | "submit";

type SubscriptionPlan = Pick<
  Database["public"]["Tables"]["subscription_plans"]["Row"],
  "id" | "name" | "slug" | "description" | "monthly_price" | "currency_code" | "is_active"
>;

export type PublishLabInitialValues = {
  id?: string;
  title: string;
  authorFullName: string;
  subtitle: string;
  description: string;
  isbn: string;
  language: string;
  publisher: string;
  publicationDate: string;
  pageCount: string;
  coAuthors: string;
  selectedCategory: string;
  tags: string;
  ageRating: string;
  edition: string;
  seriesName: string;
  seriesPosition: string;
  coverAltText: string;
  samplePages: string;
  ebookPrice: string;
  ebookDownloadable: boolean;
  ebookFileSizeMb: number | null;
  ebookStoredFileSize: number | null;
  ebookFileFormat: string | null;
  holistiqueStore: FormatState;
  paperback: FormatState;
  pocket: FormatState;
  hardcover: FormatState;
  audiobook: FormatState;
  coverPath: string | null;
  coverThumbnailUrl: string | null;
  ebookPath: string | null;
  samplePath: string | null;
  isSingleSaleEnabled: boolean;
  isSubscriptionAvailable: boolean;
  selectedPlanIds: string[];
  reviewStatus: BookReviewStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
};

type PublishLabFormProps = {
  subscriptionPlans: SubscriptionPlan[];
  initialValues?: Partial<PublishLabInitialValues>;
};

const emptyInitialValues: PublishLabInitialValues = {
  title: "",
  authorFullName: "",
  subtitle: "",
  description: "",
  isbn: "",
  language: "fr",
  publisher: "",
  publicationDate: "",
  pageCount: "",
  coAuthors: "",
  selectedCategory: "",
  tags: "",
  ageRating: "",
  edition: "",
  seriesName: "",
  seriesPosition: "",
  coverAltText: "",
  samplePages: "",
  ebookPrice: "0",
  ebookDownloadable: false,
  ebookFileSizeMb: null,
  ebookStoredFileSize: null,
  ebookFileFormat: null,
  holistiqueStore: initialOptionalFormat,
  paperback: initialOptionalFormat,
  pocket: initialOptionalFormat,
  hardcover: initialOptionalFormat,
  audiobook: initialOptionalFormat,
  coverPath: null,
  coverThumbnailUrl: null,
  ebookPath: null,
  samplePath: null,
  isSingleSaleEnabled: true,
  isSubscriptionAvailable: false,
  selectedPlanIds: [],
  reviewStatus: "draft",
  submittedAt: null,
  reviewedAt: null,
  reviewNote: null,
};

function splitCsv(input: string) {
  return input
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function getFileFormat(fileName: string) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".epub")) return "epub";
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".mobi")) return "mobi";
  return "unknown";
}

function sanitizeFileName(fileName: string) {
  const normalized = fileName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const safe = normalized.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
  return safe.replace(/^-|-$/g, "") || "file";
}

function getReviewStatusMeta(status: BookReviewStatus) {
  switch (status) {
    case "submitted":
      return {
        label: "Soumis a l'admin",
        className: "border-amber-200 bg-amber-50 text-amber-800",
      };
    case "approved":
      return {
        label: "Valide par l'admin",
        className: "border-emerald-200 bg-emerald-50 text-emerald-800",
      };
    case "rejected":
      return {
        label: "Refuse",
        className: "border-rose-200 bg-rose-50 text-rose-800",
      };
    case "changes_requested":
      return {
        label: "Corrections demandees",
        className: "border-violet-200 bg-violet-50 text-violet-800",
      };
    default:
      return {
        label: "Brouillon",
        className: "border-slate-200 bg-slate-50 text-slate-700",
      };
  }
}

function Input({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

export function PublishLabForm({ subscriptionPlans, initialValues }: PublishLabFormProps) {
  const router = useRouter();
  const initial = { ...emptyInitialValues, ...initialValues };
  const isEditMode = Boolean(initialValues?.id);

  const [title, setTitle] = useState(initial.title);
  const [authorFullName, setAuthorFullName] = useState(initial.authorFullName);
  const [subtitle, setSubtitle] = useState(initial.subtitle);
  const [description, setDescription] = useState(initial.description);
  const [isbn, setIsbn] = useState(initial.isbn);
  const [language, setLanguage] = useState(initial.language);
  const [publisher, setPublisher] = useState(initial.publisher);
  const [publicationDate, setPublicationDate] = useState(initial.publicationDate);
  const [pageCount, setPageCount] = useState(initial.pageCount);
  const [coAuthors, setCoAuthors] = useState(initial.coAuthors);
  const [selectedCategory, setSelectedCategory] = useState(initial.selectedCategory);
  const [tags, setTags] = useState(initial.tags);
  const [ageRating, setAgeRating] = useState(initial.ageRating);
  const [edition, setEdition] = useState(initial.edition);
  const [seriesName, setSeriesName] = useState(initial.seriesName);
  const [seriesPosition, setSeriesPosition] = useState(initial.seriesPosition);
  const [coverAltText, setCoverAltText] = useState(initial.coverAltText);
  const [samplePages, setSamplePages] = useState(initial.samplePages);
  const [ebookPrice, setEbookPrice] = useState(initial.ebookPrice);
  const [holistiqueStore, setHolistiqueStore] = useState<FormatState>(initial.holistiqueStore);
  const [paperback, setPaperback] = useState<FormatState>(initial.paperback);
  const [pocket, setPocket] = useState<FormatState>(initial.pocket);
  const [hardcover, setHardcover] = useState<FormatState>(initial.hardcover);
  const [audiobook, setAudiobook] = useState<FormatState>(initial.audiobook);
  const [isSingleSaleEnabled, setIsSingleSaleEnabled] = useState(initial.isSingleSaleEnabled);
  const [isSubscriptionAvailable, setIsSubscriptionAvailable] = useState(initial.isSubscriptionAvailable);
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>(initial.selectedPlanIds);
  const [cover, setCover] = useState<File | null>(null);
  const [ebookFile, setEbookFile] = useState<File | null>(null);
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvancedDetails, setShowAdvancedDetails] = useState(
    Boolean(
      initial.subtitle ||
        initial.isbn ||
        initial.publisher ||
        initial.publicationDate ||
        initial.pageCount ||
        initial.coAuthors ||
        initial.tags ||
        initial.ageRating ||
        initial.edition ||
        initial.seriesName ||
        initial.seriesPosition ||
        initial.coverAltText,
    ),
  );
  const [showOptionalFormats, setShowOptionalFormats] = useState(
    Boolean(
      initial.holistiqueStore.enabled ||
        initial.paperback.enabled ||
        initial.pocket.enabled ||
        initial.hardcover.enabled ||
        initial.audiobook.enabled ||
        initial.samplePath ||
        initial.samplePages,
    ),
  );

  const invalidIsbn = useMemo(() => {
    const digits = isbn.replace(/[^0-9]/g, "");
    return isbn.length > 0 && digits.length !== 13;
  }, [isbn]);

  const reviewStatusMeta = getReviewStatusMeta(initial.reviewStatus);

  async function uploadFileIfNeeded(
    supabase: ReturnType<typeof createClient>,
    userId: string,
    file: File | null,
    currentPath: string | null,
    folder: "covers" | "files" | "samples",
  ) {
    if (!file) return currentPath;

    const safeFileName = sanitizeFileName(file.name);
    const now = Date.now();
    const baseFolder = folder === "covers" ? `covers/${userId}` : folder === "samples" ? `files/${userId}/samples` : `files/${userId}`;
    const nextPath = `${baseFolder}/${now}-${safeFileName}`;
    const { error: uploadError } = await supabase.storage.from("books").upload(nextPath, file);
    if (uploadError) throw new Error(uploadError.message);
    return nextPath;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const submitEvent = event.nativeEvent as SubmitEvent;
    const submitter = submitEvent.submitter as HTMLButtonElement | null;
    const intent = (submitter?.value as SubmissionIntent | undefined) ?? "draft";

    if (!title.trim()) return setError("Titre requis.");
    if (!description.trim()) return setError("Description requise.");
    if (!cover && !initial.coverPath) return setError("Couverture requise.");
    if (!ebookFile && !initial.ebookPath) return setError("Fichier ebook requis.");
    if (!authorFullName.trim()) return setError("Nom complet de l auteur requis.");
    if (invalidIsbn) return setError("ISBN invalide: 13 chiffres requis.");
    if (!selectedCategory) return setError("Selectionne une categorie principale pour ce livre.");
    if (!isSingleSaleEnabled && !isSubscriptionAvailable) return setError("Active au moins un mode d acces.");
    if (isSubscriptionAvailable && selectedPlanIds.length === 0) return setError("Selectionne au moins un pack d abonnement.");
    if (paperback.enabled && paperback.printingCost && Number(paperback.printingCost) > Number(paperback.price)) {
      return setError("Le cout d impression du broche ne peut pas depasser le prix public.");
    }
    if (pocket.enabled && pocket.printingCost && Number(pocket.printingCost) > Number(pocket.price)) {
      return setError("Le cout d impression du format poche ne peut pas depasser le prix public.");
    }
    if (hardcover.enabled && hardcover.printingCost && Number(hardcover.printingCost) > Number(hardcover.price)) {
      return setError("Le cout d impression du relie ne peut pas depasser le prix public.");
    }

    setSaving(true);
    setError(null);

    const configError = getSupabaseBrowserConfigErrorMessage();
    if (configError) {
      setError(configError);
      setSaving(false);
      return;
    }

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Session expiree. Reconnecte-toi.");

      const normalizedAuthorName = authorFullName.trim();

      const [coverPath, ebookPath, samplePath] = await Promise.all([
        uploadFileIfNeeded(supabase, user.id, cover, initial.coverPath, "covers"),
        uploadFileIfNeeded(supabase, user.id, ebookFile, initial.ebookPath, "files"),
        uploadFileIfNeeded(supabase, user.id, sampleFile, initial.samplePath, "samples"),
      ]);

      const nextEbookFile = ebookFile ?? null;
      const reviewStatus: BookReviewStatus = intent === "submit" ? "submitted" : "draft";
      const normalizedTitle = title.trim();
      const normalizedDescription = description.trim();
      const bookPayload = {
        title: normalizedTitle,
        subtitle: subtitle || null,
        description: normalizedDescription,
        author_id: user.id,
        author_display_name: normalizedAuthorName,
        co_authors: splitCsv(coAuthors),
        isbn: isbn ? isbn.replace(/[^0-9]/g, "") : null,
        language,
        publisher: publisher || null,
        publication_date: publicationDate || null,
        page_count: pageCount ? Number(pageCount) : null,
        cover_url: coverPath,
        cover_thumbnail_url: coverPath ?? initial.coverThumbnailUrl ?? null,
        cover_alt_text: coverAltText || null,
        categories: [selectedCategory],
        tags: splitCsv(tags),
        age_rating: ageRating || null,
        edition: edition || null,
        series_name: seriesName || null,
        series_position: seriesPosition ? Number(seriesPosition) : null,
        file_url: ebookPath,
        file_format: nextEbookFile ? getFileFormat(nextEbookFile.name) : initial.ebookFileFormat,
        file_size: nextEbookFile ? nextEbookFile.size : initial.ebookStoredFileSize,
        sample_url: samplePath,
        sample_pages: samplePages ? Number(samplePages) : null,
        price: Number(ebookPrice),
        status: "draft" as const,
        published_at: null,
        is_single_sale_enabled: isSingleSaleEnabled,
        is_subscription_available: isSubscriptionAvailable,
        review_status: reviewStatus,
        submitted_at: reviewStatus === "submitted" ? new Date().toISOString() : null,
      } satisfies Database["public"]["Tables"]["books"]["Insert"];

      let bookId = initial.id;

      if (bookId) {
        const { error: updateError } = await supabase.from("books").update(bookPayload).eq("id", bookId).eq("author_id", user.id);
        if (updateError) throw new Error(updateError.message);
      } else {
        const { data: insertedBook, error: insertError } = await supabase.from("books").insert(bookPayload).select("id").single();
        if (insertError || !insertedBook) throw new Error(insertError?.message ?? "Creation du livre impossible.");
        bookId = insertedBook.id;
      }

      if (!bookId) throw new Error("Identifiant du livre introuvable.");

      const formatRows = [
        {
          book_id: bookId,
          format: "ebook" as const,
          price: Number(ebookPrice),
          printing_cost: null,
          file_url: ebookPath,
          stock_quantity: null,
          file_size_mb: nextEbookFile ? Math.ceil(nextEbookFile.size / (1024 * 1024)) : initial.ebookFileSizeMb ?? null,
          downloadable: false,
          is_published: false,
        },
        ...(holistiqueStore.enabled
          ? [
              {
                book_id: bookId,
                format: "holistique_store" as const,
                price: Number(holistiqueStore.price),
                printing_cost: null,
                file_url: ebookPath,
                stock_quantity: null,
                file_size_mb: nextEbookFile ? Math.ceil(nextEbookFile.size / (1024 * 1024)) : initial.ebookFileSizeMb ?? null,
                downloadable: false,
                is_published: false,
              },
            ]
          : []),
        ...(paperback.enabled
          ? [
              {
                book_id: bookId,
                format: "paperback" as const,
                price: Number(paperback.price),
                printing_cost: paperback.printingCost ? Number(paperback.printingCost) : null,
                file_url: null,
                stock_quantity: null,
                file_size_mb: null,
                downloadable: false,
                is_published: false,
              },
            ]
          : []),
        ...(pocket.enabled
          ? [
              {
                book_id: bookId,
                format: "pocket" as const,
                price: Number(pocket.price),
                printing_cost: pocket.printingCost ? Number(pocket.printingCost) : null,
                file_url: null,
                stock_quantity: null,
                file_size_mb: null,
                downloadable: false,
                is_published: false,
              },
            ]
          : []),
        ...(hardcover.enabled
          ? [
              {
                book_id: bookId,
                format: "hardcover" as const,
                price: Number(hardcover.price),
                printing_cost: hardcover.printingCost ? Number(hardcover.printingCost) : null,
                file_url: null,
                stock_quantity: null,
                file_size_mb: null,
                downloadable: false,
                is_published: false,
              },
            ]
          : []),
        ...(audiobook.enabled
          ? [
              {
                book_id: bookId,
                format: "audiobook" as const,
                price: Number(audiobook.price),
                printing_cost: null,
                file_url: null,
                stock_quantity: null,
                file_size_mb: null,
                downloadable: false,
                is_published: false,
              },
            ]
          : []),
      ];

      const { data: existingFormatsData, error: existingFormatsError } = await supabase
        .from("book_formats")
        .select("id, format, is_published")
        .eq("book_id", bookId);
      if (existingFormatsError) throw new Error(existingFormatsError.message);

      const existingFormats = new Map(
        ((existingFormatsData ?? []) as Array<{ id: string; format: BookFormatType; is_published: boolean }>).map((format) => [format.format, format]),
      );

      for (const formatRow of formatRows) {
        const existingFormat = existingFormats.get(formatRow.format);

        if (existingFormat) {
          const { error: updateFormatError } = await supabase
            .from("book_formats")
            .update(formatRow)
            .eq("id", existingFormat.id)
            .eq("book_id", bookId);

          if (updateFormatError) throw new Error(updateFormatError.message);
          continue;
        }

        const { error: insertFormatError } = await supabase.from("book_formats").insert(formatRow);
        if (insertFormatError) throw new Error(insertFormatError.message);
      }

      const disabledFormats: OptionalFormat[] = [];
      if (!holistiqueStore.enabled) disabledFormats.push("holistique_store");
      if (!paperback.enabled) disabledFormats.push("paperback");
      if (!pocket.enabled) disabledFormats.push("pocket");
      if (!hardcover.enabled) disabledFormats.push("hardcover");
      if (!audiobook.enabled) disabledFormats.push("audiobook");

      const blockedPublishedPhysicalFormats = disabledFormats.filter((format) => {
        const existingFormat = existingFormats.get(format);
        return Boolean(existingFormat?.is_published && isPhysicalBookFormat(format));
      });

      if (blockedPublishedPhysicalFormats.length > 0) {
        throw new Error(
          `Le retrait de ${blockedPublishedPhysicalFormats.join(", ")} deja publie(s) doit etre confirme par l admin.`,
        );
      }

      const deletableFormats = disabledFormats.filter((format) => existingFormats.has(format));
      if (deletableFormats.length > 0) {
        const { error: deleteFormatsError } = await supabase.from("book_formats").delete().eq("book_id", bookId).in("format", deletableFormats);
        if (deleteFormatsError) throw new Error(deleteFormatsError.message);
      }

      const { error: deletePlansError } = await supabase.from("subscription_plan_books").delete().eq("book_id", bookId);
      if (deletePlansError) throw new Error(deletePlansError.message);

      if (isSubscriptionAvailable && selectedPlanIds.length > 0) {
        const { error: insertPlansError } = await supabase
          .from("subscription_plan_books")
          .insert(selectedPlanIds.map((planId) => ({ book_id: bookId, plan_id: planId })));
        if (insertPlansError) throw new Error(insertPlansError.message);
      }

      router.push("/dashboard/author/books");
      router.refresh();
    } catch (submitError) {
      setError(getSupabaseBrowserErrorMessage(submitError, "la soumission du livre"));
    } finally {
      setSaving(false);
    }
  }

  function renderOptionalFormat(
    label: string,
    state: FormatState,
    setState: Dispatch<SetStateAction<FormatState>>,
    type: OptionalFormat,
  ) {
    const physical = isPhysicalBookFormat(type);
    const deletionLocked = physical && state.published;

    return (
      <div className="rounded-[1.5rem] border border-violet-100 bg-violet-50/70 p-4">
        <label className="flex items-center gap-3 text-sm font-semibold text-slate-800">
          <input
            type="checkbox"
            checked={state.enabled}
            disabled={deletionLocked}
            onChange={(event) => setState((previous) => ({ ...previous, enabled: event.target.checked }))}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600"
          />
          {label}
        </label>
        {deletionLocked ? (
          <p className="mt-3 rounded-[1rem] border border-[#e7ddd1] bg-white/90 px-4 py-3 text-sm leading-6 text-slate-600">
            Ce format papier est deja publie. Vous pouvez encore le modifier, mais son retrait doit etre confirme par l admin.
          </p>
        ) : null}
        {state.enabled ? (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Input label="Prix public propose">
              <input
                type="number"
                min="0"
                step="0.01"
                value={state.price}
                onChange={(event) => setState((previous) => ({ ...previous, price: event.target.value }))}
                className="w-full px-4 py-3.5 text-slate-900"
              />
            </Input>
            {physical ? (
              <Input label="Cout impression">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={state.printingCost}
                  onChange={(event) => setState((previous) => ({ ...previous, printingCost: event.target.value }))}
                  className="w-full px-4 py-3.5 text-slate-900"
                />
              </Input>
            ) : (
              <div className="rounded-[1.2rem] border border-dashed border-violet-200 bg-white/80 px-4 py-3 text-sm text-slate-500">
                {type === "holistique_store"
                  ? "Lecture protegee type Kindle dans Holistique Store: web et application, sans telechargement lecteur."
                  : "Ce format sera aussi revu par l admin avant mise en ligne."}
              </div>
            )}
            <div className="rounded-[1.2rem] border border-dashed border-violet-200 bg-white/80 px-4 py-3 text-sm text-slate-500">
              {physical
                ? "Le stock, la publication et la preparation des commandes papier restent geres par l admin."
                : "Le fichier ou la diffusion finale reste valides par l admin avant publication."}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className={`rounded-[1.6rem] border px-5 py-4 text-sm ${reviewStatusMeta.className}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">Workflow de revue</p>
            <p className="mt-2 text-base font-semibold">{reviewStatusMeta.label}</p>
          </div>
          {initial.submittedAt ? <p className="text-xs uppercase tracking-[0.14em] opacity-80">Soumis le {new Date(initial.submittedAt).toLocaleDateString("fr-FR")}</p> : null}
        </div>
        <p className="mt-3 leading-6">
          Tous les livres soumis passent maintenant par une revue admin avant publication. Les formats papier restent prepares et mis en stock uniquement par l admin.
        </p>
        {initial.reviewNote ? (
          <div className="mt-4 rounded-[1.2rem] bg-white/75 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Retour admin</p>
            <p className="mt-2 text-sm text-slate-700">{initial.reviewNote}</p>
          </div>
        ) : null}
      </div>

      <FormSection
        title={isEditMode ? "Fiche livre simplifiee" : "Ajout rapide du livre"}
        description={
          isEditMode
            ? "Commencez par les infos indispensables. Les details avances restent disponibles si vous en avez besoin."
            : "Le parcours est volontairement court: titre, auteur, description, categorie, fichiers, prix et mode de vente."
        }
      >
        <div className="mb-5 rounded-[1.5rem] border border-[#ece3d7] bg-[#fcfaf7] px-4 py-4 text-sm leading-7 text-slate-600">
          Champs vraiment requis: titre, nom affiche sur le livre, description, categorie, couverture, fichier ebook et prix.
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Input label="Titre *">
            <input required value={title} onChange={(event) => setTitle(event.target.value)} className="w-full px-4 py-3.5 text-slate-900" />
          </Input>
          <Input label="Nom affiche sur ce livre *">
            <input required value={authorFullName} onChange={(event) => setAuthorFullName(event.target.value)} className="w-full px-4 py-3.5 text-slate-900" />
          </Input>
          <Input label="Langue *">
            <input required value={language} onChange={(event) => setLanguage(event.target.value)} className="w-full px-4 py-3.5 text-slate-900" />
          </Input>
          <Input label="Prix ebook *">
            <input type="number" min="0" step="0.01" required value={ebookPrice} onChange={(event) => setEbookPrice(event.target.value)} className="w-full px-4 py-3.5 text-slate-900" />
          </Input>
          <div className="md:col-span-2">
            <Input label="Description / 4e de couverture *">
              <textarea required rows={5} value={description} onChange={(event) => setDescription(event.target.value)} className="w-full px-4 py-3.5 text-slate-900" />
            </Input>
          </div>
          <div className="md:col-span-2">
            <span className="block text-sm font-medium text-slate-700">Categorie principale *</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {BOOK_CATEGORIES.map((category) => {
                const active = selectedCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(active ? "" : category)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${active ? "border-indigo-600 bg-indigo-600 text-white" : "border-violet-200 bg-white text-slate-700"}`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[1.6rem] border border-[#ece3d7] bg-white/90 p-5">
          <button
            type="button"
            onClick={() => setShowAdvancedDetails((current) => !current)}
            className="flex w-full items-center justify-between gap-4 text-left"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">Details optionnels</p>
              <p className="mt-1 text-sm text-slate-500">ISBN, maison d edition, co-auteurs, serie, tags et autres precisions.</p>
            </div>
            <span className="rounded-full border border-violet-200 px-3 py-1 text-xs font-semibold text-slate-600">
              {showAdvancedDetails ? "Masquer" : "Afficher"}
            </span>
          </button>

          {showAdvancedDetails ? (
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <Input label="Sous-titre"><input value={subtitle} onChange={(event) => setSubtitle(event.target.value)} className="w-full px-4 py-3.5 text-slate-900" /></Input>
              <Input label="ISBN (13 chiffres)"><input value={isbn} onChange={(event) => setIsbn(event.target.value)} className="w-full px-4 py-3.5 text-slate-900" /></Input>
              <Input label="Maison d edition"><input value={publisher} onChange={(event) => setPublisher(event.target.value)} className="w-full px-4 py-3.5 text-slate-900" /></Input>
              <Input label="Date de publication souhaitee"><input type="date" value={publicationDate} onChange={(event) => setPublicationDate(event.target.value)} className="w-full px-4 py-3.5 text-slate-900" /></Input>
              <Input label="Nombre de pages"><input type="number" min="1" value={pageCount} onChange={(event) => setPageCount(event.target.value)} className="w-full px-4 py-3.5 text-slate-900" /></Input>
              <Input label="Co-auteurs (separes par virgule)"><input value={coAuthors} onChange={(event) => setCoAuthors(event.target.value)} className="w-full px-4 py-3.5 text-slate-900" /></Input>
              <Input label="Tags (separes par virgule)"><input value={tags} onChange={(event) => setTags(event.target.value)} className="w-full px-4 py-3.5 text-slate-900" /></Input>
              <Input label="Public cible"><input value={ageRating} onChange={(event) => setAgeRating(event.target.value)} className="w-full px-4 py-3.5 text-slate-900" /></Input>
              <Input label="Edition"><input value={edition} onChange={(event) => setEdition(event.target.value)} className="w-full px-4 py-3.5 text-slate-900" /></Input>
              <Input label="Nom de serie"><input value={seriesName} onChange={(event) => setSeriesName(event.target.value)} className="w-full px-4 py-3.5 text-slate-900" /></Input>
              <Input label="Position dans la serie"><input type="number" min="1" value={seriesPosition} onChange={(event) => setSeriesPosition(event.target.value)} className="w-full px-4 py-3.5 text-slate-900" /></Input>
              <div className="md:col-span-2">
                <Input label="Texte alternatif de la couverture"><input value={coverAltText} onChange={(event) => setCoverAltText(event.target.value)} className="w-full px-4 py-3.5 text-slate-900" /></Input>
              </div>
            </div>
          ) : null}
        </div>
      </FormSection>

      <FormSection
        title="Formats & fichiers"
        description="Chargez seulement l essentiel pour publier rapidement. Les formats complementaires restent optionnels."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Input label={`Couverture ${isEditMode ? "(optionnel)" : "*"}`}><input type="file" accept="image/*" required={!isEditMode} onChange={(event) => setCover(event.target.files?.[0] ?? null)} className="block w-full px-4 py-3.5 text-slate-700" /></Input>
          <Input label={`Fichier ebook ${isEditMode ? "(optionnel)" : "*"}`}><input type="file" accept=".epub,.pdf,.mobi,application/epub+zip,application/pdf" required={!isEditMode} onChange={(event) => setEbookFile(event.target.files?.[0] ?? null)} className="block w-full px-4 py-3.5 text-slate-700" /></Input>
          <div className="md:col-span-2 rounded-[1.4rem] border border-violet-100 bg-violet-50/70 px-4 py-4 text-sm leading-7 text-slate-700">
            Le nom saisi ici appartient a ce livre uniquement. Un meme compte editeur peut donc publier plusieurs auteurs differents sans ecraser son profil global.
          </div>
          <div className="md:col-span-2 rounded-[1.4rem] border border-violet-100 bg-violet-50/70 px-4 py-4 text-sm leading-7 text-slate-700">
            Ebook protege: lecture uniquement sur le site Holistique Books et dans l application. Aucun telechargement lecteur n est propose.
          </div>
        </div>

        <div className="mt-6 rounded-[1.6rem] border border-[#ece3d7] bg-white/90 p-5">
          <button
            type="button"
            onClick={() => setShowOptionalFormats((current) => !current)}
            className="flex w-full items-center justify-between gap-4 text-left"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">Formats et assets optionnels</p>
              <p className="mt-1 text-sm text-slate-500">Extrait, Holistique Store, broche, poche, relie ou audiobook si vous voulez aller plus loin.</p>
            </div>
            <span className="rounded-full border border-violet-200 px-3 py-1 text-xs font-semibold text-slate-600">
              {showOptionalFormats ? "Masquer" : "Afficher"}
            </span>
          </button>

          {showOptionalFormats ? (
            <div className="mt-5 space-y-4">
              <div className="grid gap-5 md:grid-cols-2">
                <Input label="Extrait (optionnel)"><input type="file" accept=".epub,.pdf,application/epub+zip,application/pdf" onChange={(event) => setSampleFile(event.target.files?.[0] ?? null)} className="block w-full px-4 py-3.5 text-slate-700" /></Input>
                <Input label="Nombre de pages de l extrait"><input type="number" min="1" value={samplePages} onChange={(event) => setSamplePages(event.target.value)} className="w-full px-4 py-3.5 text-slate-900" /></Input>
              </div>
              {renderOptionalFormat(getBookFormatLabel("holistique_store"), holistiqueStore, setHolistiqueStore, "holistique_store")}
              {renderOptionalFormat("Paperback (broche)", paperback, setPaperback, "paperback")}
              {renderOptionalFormat("Format poche", pocket, setPocket, "pocket")}
              {renderOptionalFormat("Hardcover (relie)", hardcover, setHardcover, "hardcover")}
              {renderOptionalFormat("Audiobook", audiobook, setAudiobook, "audiobook")}
            </div>
          ) : null}
        </div>
      </FormSection>

      <FormSection
        title="Distribution et abonnement"
        description="Definissez si le livre est vendu seul, inclus dans Premium ou les deux, puis rattachez-le aux bons packs."
      >
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="rounded-[1.4rem] border border-violet-100 bg-violet-50/70 px-4 py-4 text-sm text-slate-700"><input type="checkbox" checked={isSingleSaleEnabled} onChange={(event) => setIsSingleSaleEnabled(event.target.checked)} className="mr-3 h-4 w-4 rounded border-slate-300 text-indigo-600" /> Vente individuelle</label>
          <label className="rounded-[1.4rem] border border-violet-100 bg-violet-50/70 px-4 py-4 text-sm text-slate-700"><input type="checkbox" checked={isSubscriptionAvailable} onChange={(event) => { const checked = event.target.checked; setIsSubscriptionAvailable(checked); if (!checked) setSelectedPlanIds([]); }} className="mr-3 h-4 w-4 rounded border-slate-300 text-indigo-600" /> Inclus dans abonnement Premium</label>
        </div>
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Packs d abonnement</p>
              <p className="text-sm text-slate-600">Choisissez les packs qui donnent acces a ce livre.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{selectedPlanIds.length} selectionne{selectedPlanIds.length > 1 ? "s" : ""}</span>
          </div>
          <SubscriptionPlanSelector plans={subscriptionPlans} selectedPlanIds={selectedPlanIds} disabled={!isSubscriptionAvailable} onChange={setSelectedPlanIds} />
        </div>
      </FormSection>

      <FormSection
        title="Soumission admin"
        description="L auteur prepare la fiche, mais la publication finale et les formats papier sont revus et actives par l admin."
      >
        <div className="rounded-[1.5rem] border border-violet-100 bg-violet-50/70 p-4 text-sm text-slate-600">
          Enregistrer en brouillon garde le livre hors ligne. Soumettre pour revue envoie le livre a l admin pour validation, corrections ou refus.
        </div>
      </FormSection>

      {invalidIsbn ? <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-4 text-sm text-red-700">ISBN invalide : veuillez saisir exactement 13 chiffres.</div> : null}
      {error ? <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <div className="flex flex-wrap justify-end gap-3">
        <button type="submit" value="draft" disabled={saving} className="cta-secondary px-8 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? "Enregistrement..." : "Enregistrer en brouillon"}
        </button>
        <button type="submit" value="submit" disabled={saving} className="cta-primary px-8 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? "Soumission..." : isEditMode ? "Soumettre les modifications a l admin" : "Soumettre le livre a l admin"}
        </button>
      </div>
    </form>
  );
}
