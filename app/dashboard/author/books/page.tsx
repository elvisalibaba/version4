import Link from "next/link";
import { BookOpen, CircleDollarSign, Library, Pencil, PlusCircle, Sparkles } from "lucide-react";
import { DashboardTopbar } from "@/components/ui/dashboard-topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { resolveBookAuthorName } from "@/lib/book-authors";
import { resolveBookOfferDetails } from "@/lib/book-offers";
import { DIGITAL_BOOK_FORMATS, findPreferredFormat, getBookFormatLabel, sortFormatsByPriority } from "@/lib/book-formats";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { BookFormatType, BookReviewStatus, Database } from "@/types/database";

type MaybeArray<T> = T | T[] | null;

type AuthorBookRow = Pick<
  Database["public"]["Tables"]["books"]["Row"],
  | "id"
  | "title"
  | "subtitle"
  | "author_display_name"
  | "status"
  | "created_at"
  | "updated_at"
  | "categories"
  | "language"
  | "price"
  | "currency_code"
  | "is_single_sale_enabled"
  | "is_subscription_available"
  | "review_status"
  | "review_note"
> & {
  book_formats:
    | {
        id: string;
        format: BookFormatType;
        price: number;
        printing_cost: number | null;
        is_published: boolean;
        currency_code: string;
      }[]
    | null;
  subscription_plan_books:
    | {
        plan_id: string;
        subscription_plans: MaybeArray<{ name: string; slug: string }>;
      }[]
    | null;
};

function firstOf<T>(value: MaybeArray<T>) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function AuthorBooksPage() {
  const profile = await requireRole(["author"]);
  const supabase = await createClient();

  const { data } = await supabase
    .from("books")
      .select(
      "id, title, subtitle, author_display_name, status, created_at, updated_at, categories, language, price, currency_code, is_single_sale_enabled, is_subscription_available, review_status, review_note, book_formats(id, format, price, printing_cost, is_published, currency_code), subscription_plan_books(plan_id, subscription_plans(name, slug))",
    )
    .eq("author_id", profile.id)
    .order("created_at", { ascending: false })
    .returns<AuthorBookRow[]>();

  const books = (data ?? []) as AuthorBookRow[];
  const publishedCount = books.filter((book) => book.status === "published").length;
  const draftCount = books.filter((book) => book.status === "draft").length;
  const submittedCount = books.filter((book) => book.review_status === "submitted").length;
  const totalFormats = books.reduce((sum, book) => sum + (book.book_formats?.length ?? 0), 0);
  const premiumEnabledCount = books.filter((book) => book.is_subscription_available).length;
  const statusMeta = {
    published: { label: "Publie", className: "bg-emerald-100 text-emerald-700" },
    draft: { label: "Brouillon", className: "bg-[#faf1e1] text-[#a06a2b]" },
    coming_soon: { label: "Bientot disponible", className: "bg-[#edf4f7] text-[#3d6f83]" },
    archived: { label: "Archive", className: "bg-[#f2f0ec] text-[#5c544b]" },
  } as const;

  const reviewMeta: Record<BookReviewStatus, { label: string; className: string }> = {
    draft: { label: "Brouillon", className: "bg-[#f2f0ec] text-[#5c544b]" },
    submitted: { label: "Soumis", className: "bg-[#faf1e1] text-[#a06a2b]" },
    approved: { label: "Valide", className: "bg-emerald-100 text-emerald-700" },
    rejected: { label: "Refuse", className: "bg-[#fde9e3] text-[#b45b48]" },
    changes_requested: { label: "Corrections", className: "bg-[#f8efe7] text-[#a85b3f]" },
  };

  return (
    <section className="space-y-6">
      <DashboardTopbar
        kicker="Catalogue auteur"
        title="Gerez vos livres"
        description="Vue complete de vos titres, formats, statuts et disponibilites commerciales dans un rendu plus lisible et plus editorial."
        actions={
          <>
            <Link href="/dashboard/author/add-book" className="cta-primary px-5 py-3 text-sm">
              <PlusCircle className="h-4 w-4" />
              Ajouter un livre
            </Link>
            <Link href="/dashboard/author/sales" className="cta-secondary px-5 py-3 text-sm">
              <CircleDollarSign className="h-4 w-4" />
              Voir les ventes
            </Link>
          </>
        }
      />

      <div className="metric-grid">
        <StatCard icon={BookOpen} label="Livres" value={books.length} description="Total catalogue" tone="violet" />
        <StatCard icon={Sparkles} label="Publies" value={publishedCount} description="Disponibles en vente" tone="emerald" />
        <StatCard icon={Sparkles} label="Brouillons" value={draftCount} description="A finaliser" tone="amber" />
        <StatCard icon={Sparkles} label="Soumis" value={submittedCount} description="En attente admin" tone="rose" />
        <StatCard icon={Library} label="Formats" value={totalFormats} description="Tous formats confondus" tone="sky" />
      </div>

      <section className="surface-panel p-6">
        <div className="section-header">
          <div className="space-y-2">
            <p className="section-kicker">Publishing list</p>
            <h2 className="section-title text-2xl">Votre catalogue</h2>
            <p className="section-description">Chaque livre conserve sa logique metier, mais l interface auteur gagne une lecture plus claire, plus premium et plus exploitable.</p>
          </div>
          <span className="catalog-badge">{premiumEnabledCount} titre(s) Premium</span>
        </div>

        <div className="mt-5 space-y-4">
          {books.length > 0 ? (
            books.map((book) => {
              const primaryDigitalFormat = findPreferredFormat(
                (book.book_formats ?? []).filter(
                  (format) => format.is_published && DIGITAL_BOOK_FORMATS.includes(format.format as (typeof DIGITAL_BOOK_FORMATS)[number]),
                ),
                DIGITAL_BOOK_FORMATS,
              );
              const offer = resolveBookOfferDetails({
                price: primaryDigitalFormat?.price ?? book.price,
                currencyCode: primaryDigitalFormat?.currency_code ?? book.currency_code,
                isSingleSaleEnabled: book.is_single_sale_enabled,
                isSubscriptionAvailable: book.is_subscription_available,
              });
              const publishedAuthorName = resolveBookAuthorName(book.author_display_name, profile.name);

              const planLabels = (book.subscription_plan_books ?? [])
                .map((entry) => firstOf(entry.subscription_plans)?.name ?? null)
                .filter((value): value is string => Boolean(value));

              return (
                <article
                  key={book.id}
                  className="rounded-[1.85rem] border border-[#ece3d7] bg-[linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(250,245,239,0.96))] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-950">{book.title}</h2>
                      {book.subtitle ? <p className="mt-1 text-sm text-slate-500">{book.subtitle}</p> : null}
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Publie sous {publishedAuthorName}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusMeta[book.status]?.className ?? statusMeta.draft.className}`}>
                        {statusMeta[book.status]?.label ?? statusMeta.draft.label}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${reviewMeta[book.review_status]?.className ?? reviewMeta.draft.className}`}>
                        {reviewMeta[book.review_status]?.label ?? reviewMeta.draft.label}
                      </span>
                      <Link href={`/dashboard/author/books/${book.id}/edit`} className="cta-secondary px-4 py-2 text-sm">
                        <Pencil className="h-3.5 w-3.5" />
                        Modifier
                      </Link>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <p className="rounded-[1.2rem] bg-white/85 px-4 py-3 text-sm text-slate-600">
                      Langue: <span className="font-medium text-slate-950">{book.language}</span>
                    </p>
                    <p className="rounded-[1.2rem] bg-white/85 px-4 py-3 text-sm text-slate-600">
                      Categories: <span className="font-medium text-slate-950">{book.categories.length ? book.categories.join(", ") : "Aucune"}</span>
                    </p>
                    <p className="rounded-[1.2rem] bg-white/85 px-4 py-3 text-sm text-slate-600">
                      Cree: <span className="font-medium text-slate-950">{new Date(book.created_at).toLocaleDateString("fr-FR")}</span>
                    </p>
                    <p className="rounded-[1.2rem] bg-white/85 px-4 py-3 text-sm text-slate-600">
                      Maj: <span className="font-medium text-slate-950">{new Date(book.updated_at).toLocaleDateString("fr-FR")}</span>
                    </p>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
                    <div className="rounded-[1.35rem] bg-white/85 p-4 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Formats</p>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        {sortFormatsByPriority(book.book_formats ?? [])
                          .map((format) =>
                            `${getBookFormatLabel(format.format)} (${format.price.toFixed(2)} ${format.currency_code})${
                              format.printing_cost !== null ? `, impression ${format.printing_cost.toFixed(2)} ${format.currency_code}` : ""
                            }${format.is_published ? "" : " [validation admin]"}`,
                          )
                          .join(" | ") || "Aucun format"}
                      </p>
                    </div>

                    <div className="rounded-[1.35rem] bg-white/85 p-4 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Commercialisation</p>
                      <p className="mt-3 text-sm font-semibold text-slate-950">{offer.offerSummaryLabel}</p>
                      <p className="mt-1 text-sm text-slate-500">{offer.displayPriceLabel}</p>
                      {planLabels.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {planLabels.map((label) => (
                            <span key={`${book.id}-${label}`} className="catalog-badge">
                              {label}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {book.review_note ? <p className="mt-3 text-sm text-slate-500">Retour admin: {book.review_note}</p> : null}
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState
              title="Aucun livre dans votre catalogue"
              description="Ajoutez votre premier livre pour alimenter votre studio auteur."
              action={
                <Link href="/dashboard/author/add-book" className="cta-primary px-5 py-3 text-sm">
                  <PlusCircle className="h-4 w-4" />
                  Creer votre premier livre
                </Link>
              }
            />
          )}
        </div>
      </section>
    </section>
  );
}
