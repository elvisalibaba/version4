"use client";

import { useImperativeHandle, useMemo, useRef, useState, type Ref } from "react";
import { useRouter } from "next/navigation";
import { SubscriptionPlanSelector } from "@/components/author/subscription-plan-selector";
import { generateBookCover } from "@/lib/book-cover";
import type { ApiSubscriptionPlan, BookReviewStatus } from "@/types/api";

export type SubmissionIntent = "draft" | "submit";

export type PublishLabFormHandle = {
  validate: (intent?: SubmissionIntent) => boolean;
  save: (intent: SubmissionIntent) => Promise<boolean>;
};

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
  ebookPath: string | null;
  coverPath: string | null;
  isSingleSaleEnabled: boolean;
  isSubscriptionAvailable: boolean;
  selectedPlanIds: string[];
  reviewStatus: BookReviewStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  writingStatus: string;
  targetWordCount: string;
  currentWordCount: string;
  nextAuthorAction: string;
  editorialDeadline: string;
  authorPrivateNotes: string;
};

export type PublishLabFormProps = {
  subscriptionPlans: ApiSubscriptionPlan[];
  initialValues?: Partial<PublishLabInitialValues>;
  ref?: Ref<PublishLabFormHandle>;
  batchMode?: boolean;
  disabled?: boolean;
};

const defaults: PublishLabInitialValues = {
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
  ebookPath: null,
  coverPath: null,
  isSingleSaleEnabled: true,
  isSubscriptionAvailable: false,
  selectedPlanIds: [],
  reviewStatus: "draft",
  submittedAt: null,
  reviewedAt: null,
  reviewNote: null,
  writingStatus: "idea",
  targetWordCount: "",
  currentWordCount: "",
  nextAuthorAction: "",
  editorialDeadline: "",
  authorPrivateNotes: "",
};

function splitCsv(value: string) {
  return value.split(",").map((entry) => entry.trim()).filter(Boolean);
}

function reviewLabel(status: BookReviewStatus) {
  if (status === "submitted") return "En vérification";
  if (status === "approved") return "Validé";
  if (status === "rejected") return "Refusé";
  if (status === "changes_requested") return "Corrections demandées";
  return "Brouillon";
}

export function PublishLabForm({
  subscriptionPlans,
  initialValues,
  ref,
  batchMode = false,
  disabled = false,
}: PublishLabFormProps) {
  const router = useRouter();
  const initial = { ...defaults, ...initialValues };
  const isEdit = Boolean(initial.id);

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
  const [category, setCategory] = useState(initial.selectedCategory);
  const [tags, setTags] = useState(initial.tags);
  const [ageRating, setAgeRating] = useState(initial.ageRating);
  const [edition, setEdition] = useState(initial.edition);
  const [seriesName, setSeriesName] = useState(initial.seriesName);
  const [seriesPosition, setSeriesPosition] = useState(initial.seriesPosition);
  const [coverAltText, setCoverAltText] = useState(initial.coverAltText);
  const [samplePages, setSamplePages] = useState(initial.samplePages);
  const [price, setPrice] = useState(initial.ebookPrice);
  const [singleSale, setSingleSale] = useState(initial.isSingleSaleEnabled);
  const [subscription, setSubscription] = useState(initial.isSubscriptionAvailable);
  const [planIds, setPlanIds] = useState<string[]>(initial.selectedPlanIds);
  const [ebookFile, setEbookFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [writingStatus, setWritingStatus] = useState(initial.writingStatus);
  const [targetWordCount, setTargetWordCount] = useState(initial.targetWordCount);
  const [currentWordCount, setCurrentWordCount] = useState(initial.currentWordCount);
  const [nextAuthorAction, setNextAuthorAction] = useState(initial.nextAuthorAction);
  const [editorialDeadline, setEditorialDeadline] = useState(initial.editorialDeadline);
  const [authorPrivateNotes, setAuthorPrivateNotes] = useState(initial.authorPrivateNotes);
  const [busy, setBusy] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false);

  const isbnInvalid = useMemo(() => {
    const digits = isbn.replace(/\D/g, "");
    return Boolean(isbn && digits.length !== 13);
  }, [isbn]);

  function validationMessage(intent: SubmissionIntent = "draft") {
    if (!title.trim()) return "Le titre est obligatoire.";
    if (isbnInvalid) return "L’ISBN doit contenir 13 chiffres.";

    if (
      intent === "submit"
      && !isEdit
      && !ebookFile
      && !initial.ebookPath
    ) {
      return "Ajoutez le manuscrit avant de l’envoyer à l’équipe éditoriale.";
    }

    return null;
  }

  function validate(intent: SubmissionIntent = "draft") {
    const message = validationMessage(intent);
    setError(message);
    return message === null;
  }

  async function save(intent: SubmissionIntent) {
    if (savingRef.current || disabled || !validate(intent)) return false;
    savingRef.current = true;
    setBusy(true);
    setError(null);

    try {
      const form = new FormData();
      form.set("title", title.trim());
      if (authorFullName.trim()) form.set("author_display_name", authorFullName.trim());
      if (subtitle.trim()) form.set("subtitle", subtitle.trim());
      if (description.trim()) form.set("description", description.trim());
      form.set("price", String(Math.max(0, Number(price || 0))));
      form.set("currency_code", "USD");
      form.set("language", language.trim() || "fr");
      form.set("is_single_sale_enabled", singleSale ? "1" : "0");
      form.set("is_subscription_available", subscription ? "1" : "0");
      form.set("status", intent === "submit" ? "published" : "draft");
      form.set("writing_status", writingStatus || "idea");

      if (targetWordCount) form.set("target_word_count", targetWordCount);
      if (currentWordCount) form.set("current_word_count", currentWordCount);
      if (nextAuthorAction.trim()) form.set("next_author_action", nextAuthorAction.trim());
      if (editorialDeadline) form.set("editorial_deadline", editorialDeadline);
      if (authorPrivateNotes.trim()) form.set("author_private_notes", authorPrivateNotes.trim());

      if (isbn.trim()) form.set("isbn", isbn.replace(/\D/g, ""));
      if (publisher.trim()) form.set("publisher", publisher.trim());
      if (publicationDate) form.set("publication_date", publicationDate);
      if (pageCount) form.set("page_count", pageCount);
      if (ageRating.trim()) form.set("age_rating", ageRating.trim());
      if (edition.trim()) form.set("edition", edition.trim());
      if (seriesName.trim()) form.set("series_name", seriesName.trim());
      if (seriesPosition) form.set("series_position", seriesPosition);
      if (coverAltText.trim()) form.set("cover_alt_text", coverAltText.trim());
      if (samplePages) form.set("sample_pages", samplePages);

      splitCsv(coAuthors).forEach((value) => form.append("co_authors[]", value));
      if (category.trim()) form.append("categories[]", category.trim());
      splitCsv(tags).forEach((value) => form.append("tags[]", value));
      if (subscription) planIds.forEach((id) => form.append("subscription_plan_ids[]", id));

      if (ebookFile) {
        form.set("file", ebookFile);
        const extension = ebookFile.name.split(".").pop()?.toLowerCase() || "file";
        form.set("file_format", extension);
      }

      let effectiveCover = coverFile;
      if (!effectiveCover && ebookFile) {
        setStatusText("Génération de la couverture…");
        try {
          effectiveCover = await generateBookCover(ebookFile);
        } catch {
          effectiveCover = null;
        }
      }
      if (effectiveCover) form.set("cover", effectiveCover);
      if (sampleFile) form.set("sample", sampleFile);

      setStatusText(intent === "submit" ? "Envoi pour validation…" : "Enregistrement du brouillon…");
      const target = isEdit ? `/api/backend/books/${encodeURIComponent(initial.id!)}` : "/api/backend/books";
      const response = await fetch(target, {
        method: "POST",
        body: form,
        headers: { Accept: "application/json" },
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const validationErrors = payload?.errors
          ? Object.values(payload.errors as Record<string, string[]>).flat().join(" ")
          : null;
        throw new Error(validationErrors || payload?.message || "Impossible d’enregistrer le livre.");
      }

      setStatusText(intent === "submit" ? "Livre soumis à validation." : "Brouillon enregistré.");
      router.refresh();
      if (!batchMode) router.push("/dashboard/author/books");
      return true;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Enregistrement impossible.");
      return false;
    } finally {
      setBusy(false);
      savingRef.current = false;
    }
  }

  useImperativeHandle(ref, () => ({ validate, save }));

  return (
    <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e5d9cc] bg-[#fffaf2] px-4 py-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.17em] text-[#a85b3f]">Publication Laravel</p>
          <p className="mt-1 text-sm font-semibold text-[#173d2c]">Statut actuel : {reviewLabel(initial.reviewStatus)}</p>
        </div>
        {initial.reviewNote ? <p className="max-w-xl text-sm text-[#76522b]">{initial.reviewNote}</p> : null}
      </div>

      {error ? <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{error}</p> : null}
      {statusText ? <p role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{statusText}</p> : null}

      <fieldset disabled={busy || disabled} className="grid gap-5 rounded-[1.75rem] border border-[#e5d9cc] bg-white p-5 sm:grid-cols-2 sm:p-7">
        <Field label="Titre *"><input value={title} onChange={(e) => setTitle(e.target.value)} className="form-input" /></Field>
        <Field label="Nom public de l’auteur"><input value={authorFullName} onChange={(e) => setAuthorFullName(e.target.value)} className="form-input" /></Field>
        <Field label="Sous-titre"><input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="form-input" /></Field>
        <Field label="Catégorie principale"><input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Roman, Business, Spiritualité…" className="form-input" /></Field>
        <Field label="Description" full><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} className="form-input resize-y py-3" /></Field>
        <Field label="Prix USD"><input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="form-input" /></Field>
        <Field label="Langue"><input value={language} onChange={(e) => setLanguage(e.target.value)} className="form-input" /></Field>
        <Field label="ISBN"><input value={isbn} onChange={(e) => setIsbn(e.target.value)} className="form-input" /></Field>
        <Field label="Éditeur"><input value={publisher} onChange={(e) => setPublisher(e.target.value)} className="form-input" /></Field>
        <Field label="Date de publication"><input type="date" value={publicationDate} onChange={(e) => setPublicationDate(e.target.value)} className="form-input" /></Field>
        <Field label="Nombre de pages"><input type="number" min="1" value={pageCount} onChange={(e) => setPageCount(e.target.value)} className="form-input" /></Field>
        <Field label="Co-auteurs"><input value={coAuthors} onChange={(e) => setCoAuthors(e.target.value)} placeholder="Nom 1, Nom 2" className="form-input" /></Field>
        <Field label="Tags"><input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="innovation, afrique, roman" className="form-input" /></Field>
        <Field label="Public / âge"><input value={ageRating} onChange={(e) => setAgeRating(e.target.value)} className="form-input" /></Field>
        <Field label="Édition"><input value={edition} onChange={(e) => setEdition(e.target.value)} className="form-input" /></Field>
        <Field label="Série"><input value={seriesName} onChange={(e) => setSeriesName(e.target.value)} className="form-input" /></Field>
        <Field label="Position dans la série"><input type="number" min="1" value={seriesPosition} onChange={(e) => setSeriesPosition(e.target.value)} className="form-input" /></Field>
        <Field label="Texte alternatif couverture"><input value={coverAltText} onChange={(e) => setCoverAltText(e.target.value)} className="form-input" /></Field>
        <Field label="Pages d’extrait"><input type="number" min="0" value={samplePages} onChange={(e) => setSamplePages(e.target.value)} className="form-input" /></Field>
      </fieldset>

      <fieldset disabled={busy || disabled} className="rounded-[1.75rem] border border-[#d8e5dd] bg-[#f7fbf8] p-5 sm:p-7">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.17em] text-[#39705a]">Atelier d’écriture</p>
          <h2 className="mt-2 text-lg font-bold text-[#173d2c]">Piloter le manuscrit comme un projet éditorial</h2>
          <p className="mt-1 text-sm leading-6 text-[#65736b]">Ces informations restent dans votre espace auteur et aident l’équipe éditoriale à suivre l’avancement.</p>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="État de l’écriture">
            <select value={writingStatus} onChange={(e) => setWritingStatus(e.target.value)} className="form-input">
              <option value="idea">Idée / concept</option>
              <option value="outline">Plan / structure</option>
              <option value="writing">Rédaction en cours</option>
              <option value="self_review">Relecture auteur</option>
              <option value="submitted">Soumis à l’équipe éditoriale</option>
              <option value="editor_review">En traitement éditorial</option>
              <option value="changes_requested">Corrections demandées</option>
              <option value="ready_for_layout">Prêt pour mise en page</option>
              <option value="completed">Manuscrit finalisé</option>
            </select>
          </Field>
          <Field label="Échéance cible"><input type="date" value={editorialDeadline} onChange={(e) => setEditorialDeadline(e.target.value)} className="form-input" /></Field>
          <Field label="Objectif de mots"><input type="number" min="1" value={targetWordCount} onChange={(e) => setTargetWordCount(e.target.value)} className="form-input" /></Field>
          <Field label="Nombre de mots actuel"><input type="number" min="0" value={currentWordCount} onChange={(e) => setCurrentWordCount(e.target.value)} className="form-input" /></Field>
          <Field label="Prochaine action" full><textarea rows={3} value={nextAuthorAction} onChange={(e) => setNextAuthorAction(e.target.value)} className="form-input resize-y py-3" placeholder="Ex. terminer le chapitre 6, intégrer les remarques de l’éditeur..." /></Field>
          <Field label="Notes privées de l’auteur" full><textarea rows={4} value={authorPrivateNotes} onChange={(e) => setAuthorPrivateNotes(e.target.value)} className="form-input resize-y py-3" placeholder="Notes personnelles de travail, non publiques." /></Field>
        </div>
      </fieldset>

      <fieldset disabled={busy || disabled} className="rounded-[1.75rem] border border-[#e5d9cc] bg-white p-5 sm:p-7">
        <h2 className="text-lg font-bold text-[#173d2c]">Fichiers numériques</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <FileField label={isEdit ? "Remplacer le manuscrit" : "Manuscrit"} accept=".pdf,.epub,.mobi,.azw3" onChange={setEbookFile} />
          <FileField label="Couverture (optionnel)" accept="image/jpeg,image/png,image/webp" onChange={setCoverFile} />
          <FileField label="Extrait sécurisé (PDF recommandé)" accept=".pdf,.epub" onChange={setSampleFile} />
        </div>
        {isEdit && initial.ebookPath ? <p className="mt-3 text-xs text-emerald-700">Un fichier numérique privé est déjà enregistré. Laissez le champ vide pour le conserver.</p> : null}
      </fieldset>

      <fieldset disabled={busy || disabled} className="rounded-[1.75rem] border border-[#e5d9cc] bg-white p-5 sm:p-7">
        <h2 className="text-lg font-bold text-[#173d2c]">Modes d’accès</h2>
        <div className="mt-4 flex flex-wrap gap-4">
          <Toggle checked={singleSale} onChange={setSingleSale} label="Vente à l’unité" />
          <Toggle checked={subscription} onChange={setSubscription} label="Disponible dans Premium" />
        </div>
        {subscription ? <div className="mt-5"><SubscriptionPlanSelector plans={subscriptionPlans} selectedPlanIds={planIds} disabled={busy || disabled} onChange={setPlanIds} /></div> : null}
      </fieldset>

      {!batchMode ? (
        <div className="flex flex-wrap justify-end gap-3">
          <button type="button" disabled={busy || disabled} onClick={() => void save("draft")} className="cta-secondary px-6 py-3 text-sm disabled:opacity-50">Enregistrer en brouillon</button>
          <button type="button" disabled={busy || disabled} onClick={() => void save("submit")} className="cta-primary px-6 py-3 text-sm disabled:opacity-50">Envoyer pour publication</button>
        </div>
      ) : null}
    </form>
  );
}

function Field({ label, full = false, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return <label className={`grid gap-2 text-sm font-bold text-[#403830] ${full ? "sm:col-span-2" : ""}`}><span>{label}</span>{children}</label>;
}

function FileField({ label, accept, onChange }: { label: string; accept: string; onChange: (file: File | null) => void }) {
  return <label className="grid gap-2 text-sm font-bold text-[#403830]"><span>{label}</span><input type="file" accept={accept} onChange={(e) => onChange(e.target.files?.[0] ?? null)} className="block w-full rounded-xl border border-[#ded2c6] bg-[#fcfaf7] px-3 py-3 text-sm" /></label>;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return <label className="inline-flex items-center gap-3 rounded-full border border-[#ded2c6] bg-[#fcfaf7] px-4 py-2 text-sm font-semibold"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />{label}</label>;
}
