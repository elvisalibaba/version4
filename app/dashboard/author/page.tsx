import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CircleDollarSign,
  Eye,
  Files,
  Library,
  PlusCircle,
  TrendingUp,
} from "lucide-react";
import { DashboardTopbar } from "@/components/ui/dashboard-topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { getLibraryAccessLabel } from "@/lib/access-labels";
import { resolveBookAuthorName } from "@/lib/book-authors";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { BookReviewStatus, Database } from "@/types/database";

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
  | "price"
  | "currency_code"
  | "review_status"
  | "review_note"
  | "views_count"
  | "purchases_count"
  | "rating_avg"
  | "ratings_count"
  | "cover_url"
  | "description"
  | "categories"
  | "is_subscription_available"
  | "is_single_sale_enabled"
> & {
  book_formats:
    | Pick<Database["public"]["Tables"]["book_formats"]["Row"], "id" | "format" | "is_published">[]
    | null;
  subscription_plan_books:
    | Pick<Database["public"]["Tables"]["subscription_plan_books"]["Row"], "id" | "plan_id">[]
    | null;
};

type OrderItemRow = Pick<
  Database["public"]["Tables"]["order_items"]["Row"],
  "book_id" | "price" | "currency_code"
> & {
  orders:
    | Pick<Database["public"]["Tables"]["orders"]["Row"], "payment_status" | "created_at">[]
    | Pick<Database["public"]["Tables"]["orders"]["Row"], "payment_status" | "created_at">
    | null;
};

type AcquisitionRow = Pick<
  Database["public"]["Tables"]["library"]["Row"],
  "user_id" | "book_id" | "purchased_at" | "access_type"
> & {
  profiles:
    | Pick<Database["public"]["Tables"]["profiles"]["Row"], "name" | "email">[]
    | Pick<Database["public"]["Tables"]["profiles"]["Row"], "name" | "email">
    | null;
};

type AuthorProfileRow = Pick<
  Database["public"]["Tables"]["author_profiles"]["Row"],
  | "display_name"
  | "bio"
  | "professional_headline"
  | "website"
  | "location"
  | "phone"
  | "genres"
  | "publishing_goals"
>;

function firstOf<T>(value: MaybeArray<T>) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function formatCurrency(amount: number, currencyCode = "USD") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatPercent(value: number) {
  return `${value.toFixed(value >= 10 || Number.isInteger(value) ? 0 : 1)}%`;
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRevenueBreakdown(items: Array<{ amount: number; currencyCode: string }>) {
  const totals = new Map<string, number>();
  for (const item of items) {
    totals.set(item.currencyCode, (totals.get(item.currencyCode) ?? 0) + item.amount);
  }

  if (!totals.size) {
    return "Aucun revenu confirme";
  }

  return [...totals.entries()].map(([currencyCode, amount]) => formatCurrency(amount, currencyCode)).join(" • ");
}

const statusMeta = {
  published: { label: "Publie", className: "bg-[#edf7f0] text-[#2f6f4f]" },
  draft: { label: "Brouillon", className: "bg-[#fff3e2] text-[#a06a2b]" },
  coming_soon: { label: "Bientot", className: "bg-[#edf6fb] text-[#3d6f83]" },
  archived: { label: "Archive", className: "bg-[#f3f1ee] text-[#5c544b]" },
} as const;

const reviewMeta: Record<BookReviewStatus, { label: string; className: string }> = {
  draft: { label: "Brouillon", className: "bg-[#f3f1ee] text-[#5c544b]" },
  submitted: { label: "Soumis", className: "bg-[#fff3e2] text-[#a06a2b]" },
  approved: { label: "Valide", className: "bg-[#edf7f0] text-[#2f6f4f]" },
  rejected: { label: "Refuse", className: "bg-[#fff0eb] text-[#b45b48]" },
  changes_requested: { label: "Corrections", className: "bg-[#eaf1ff] text-[#2f5ea8]" },
};

export default async function AuthorDashboardPage() {
  const profile = await requireRole(["author"]);
  const supabase = await createClient();

  const { data: booksData } = await supabase
    .from("books")
    .select(
      "id, title, subtitle, author_display_name, status, created_at, updated_at, price, currency_code, review_status, review_note, views_count, purchases_count, rating_avg, ratings_count, cover_url, description, categories, is_subscription_available, is_single_sale_enabled, book_formats(id, format, is_published), subscription_plan_books(id, plan_id)",
    )
    .eq("author_id", profile.id)
    .order("updated_at", { ascending: false })
    .returns<AuthorBookRow[]>();

  const books = (booksData ?? []) as AuthorBookRow[];
  const bookIds = books.map((book) => book.id);

  const [{ data: orderItemsData }, { data: acquisitionsData }, { data: authorProfileData }] = await Promise.all([
    bookIds.length
      ? supabase
          .from("order_items")
          .select("book_id, price, currency_code, orders:order_id(payment_status, created_at)")
          .in("book_id", bookIds)
          .returns<OrderItemRow[]>()
      : Promise.resolve({ data: [] as OrderItemRow[] }),
    bookIds.length
      ? supabase
          .from("library")
          .select("user_id, book_id, purchased_at, access_type, profiles:user_id(name, email)")
          .in("book_id", bookIds)
          .order("purchased_at", { ascending: false })
          .returns<AcquisitionRow[]>()
      : Promise.resolve({ data: [] as AcquisitionRow[] }),
    supabase
      .from("author_profiles")
      .select("display_name, bio, professional_headline, website, location, phone, genres, publishing_goals")
      .eq("id", profile.id)
      .returns<AuthorProfileRow>()
      .maybeSingle(),
  ]);

  const orderItems = (orderItemsData ?? []) as OrderItemRow[];
  const acquisitions = (acquisitionsData ?? []) as AcquisitionRow[];
  const authorProfile = (authorProfileData ?? null) as AuthorProfileRow | null;

  const paidSales = orderItems.filter((item) => {
    const order = firstOf(item.orders);
    return order?.payment_status === "paid";
  });

  const totalBooks = books.length;
  const publishedBooks = books.filter((book) => book.status === "published").length;
  const draftBooks = books.filter((book) => book.status === "draft").length;
  const reviewQueueCount = books.filter((book) => ["submitted", "changes_requested"].includes(book.review_status)).length;
  const totalViews = books.reduce((sum, book) => sum + Number(book.views_count ?? 0), 0);
  const totalPurchases = books.reduce((sum, book) => sum + Number(book.purchases_count ?? 0), 0);
  const conversionRate = totalViews > 0 ? (totalPurchases / totalViews) * 100 : 0;
  const uniqueReaders = new Set(acquisitions.map((item) => item.user_id)).size;
  const freeClaims = acquisitions.filter((item) => item.access_type === "free").length;
  const subscriptionClaims = acquisitions.filter((item) => item.access_type === "subscription").length;
  const singleSaleEnabledCount = books.filter((book) => book.is_single_sale_enabled).length;
  const premiumEnabledCount = books.filter((book) => book.is_subscription_available).length;
  const formattedRevenue = formatRevenueBreakdown(
    paidSales.map((item) => ({ amount: Number(item.price ?? 0), currencyCode: item.currency_code ?? "USD" })),
  );

  const profileFields = [
    { label: "Nom public", completed: Boolean(authorProfile?.display_name) },
    { label: "Headline", completed: Boolean(authorProfile?.professional_headline) },
    { label: "Bio", completed: Boolean(authorProfile?.bio) },
    { label: "Website", completed: Boolean(authorProfile?.website) },
    { label: "Localisation", completed: Boolean(authorProfile?.location) },
    { label: "Genres", completed: Boolean(authorProfile?.genres?.length) },
  ];
  const completedProfileFields = profileFields.filter((field) => field.completed).length;
  const profileScore = profileFields.length > 0 ? Math.round((completedProfileFields / profileFields.length) * 100) : 0;
  const missingProfileFields = profileFields.filter((field) => !field.completed).map((field) => field.label);

  const pipelineBooks = books.slice(0, 6).map((book) => {
    const metadataChecks = [
      Boolean(book.description),
      Boolean(book.cover_url),
      Boolean(book.categories?.length),
      Number(book.price ?? 0) > 0,
      Boolean((book.book_formats ?? []).some((format) => format.is_published)),
    ].filter(Boolean).length;
    const readinessLabel =
      metadataChecks >= 5 ? "Pret a pousser" : metadataChecks >= 3 ? "A completer" : "A structurer";

    return {
      ...book,
      metadataChecks,
      readinessLabel,
      formatCount: book.book_formats?.length ?? 0,
      publishedFormats: (book.book_formats ?? []).filter((format) => format.is_published).length,
      planCount: book.subscription_plan_books?.length ?? 0,
    };
  });

  const recentReaders = acquisitions.slice(0, 5);
  const strongestBook =
    [...books].sort((left, right) => (right.views_count ?? 0) - (left.views_count ?? 0))[0] ?? null;

  return (
    <section className="space-y-6">
      <DashboardTopbar
        kicker="Publishing console"
        title={`Studio auteur de ${profile.name ?? profile.email}`}
        description="Une page plus proche de KDP pour suivre la mise en ligne, la qualite catalogue, les revenus et les signaux audience."
        actions={
          <>
            <Link
              href="/dashboard/author/add-book"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[#171717] px-4 text-sm font-semibold text-white transition hover:bg-[#0f172a]"
            >
              <PlusCircle className="h-4 w-4" />
              Nouveau titre
            </Link>
            <Link
              href="/dashboard/author/books"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-[#e7ddd1] bg-white px-4 text-sm font-semibold text-[#26221d] transition hover:border-[#d5c8bb]"
            >
              <Library className="h-4 w-4" />
              Mon catalogue
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={BookOpen} label="Titres" value={totalBooks} description="Dans votre catalogue" tone="violet" />
        <StatCard icon={CircleDollarSign} label="Revenus" value={formattedRevenue} description="Ventes confirmees" tone="emerald" />
        <StatCard icon={Eye} label="Vues" value={totalViews} description="Interet total catalogue" tone="sky" />
        <StatCard icon={TrendingUp} label="Conversion" value={formatPercent(conversionRate)} description="Vues vers achats" tone="amber" />
        <StatCard icon={Files} label="File de revue" value={reviewQueueCount} description="Soumis ou a corriger" tone="rose" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.42fr)_360px]">
        <section className="rounded-[30px] border border-[#e7ddd1] bg-white/95 p-5 shadow-[0_22px_50px_rgba(15,23,42,0.05)] sm:p-6">
          <div className="flex flex-col gap-3 border-b border-[#f1e8de] pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#a85b3f]">Publishing pipeline</p>
              <h2 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-[#171717]">Priorites de publication</h2>
              <p className="text-sm leading-7 text-[#6f665e]">
                Chaque titre remonte avec son statut, sa revue, ses signaux de vente et son niveau de preparation.
              </p>
            </div>
            <Link
              href="/dashboard/author/books"
              className="inline-flex h-11 items-center justify-center rounded-full border border-[#e7ddd1] bg-[#fcfaf7] px-4 text-sm font-semibold text-[#26221d] transition hover:border-[#d5c8bb] hover:bg-white"
            >
              Ouvrir le catalogue
            </Link>
          </div>

          <div className="mt-5 grid gap-4">
            {pipelineBooks.length > 0 ? (
              pipelineBooks.map((book) => (
                <article key={book.id} className="rounded-[26px] border border-[#ece3d7] bg-[#fcfaf7] p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.15em] ${statusMeta[book.status].className}`}>
                          {statusMeta[book.status].label}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.15em] ${reviewMeta[book.review_status].className}`}>
                          {reviewMeta[book.review_status].label}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-[#6f665e]">
                          {book.readinessLabel}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold tracking-[-0.03em] text-[#171717]">{book.title}</h3>
                        {book.subtitle ? <p className="mt-1 text-sm text-[#6f665e]">{book.subtitle}</p> : null}
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8b8177]">
                          {resolveBookAuthorName(book.author_display_name, authorProfile?.display_name, profile.name)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8b8177]">
                        <span>{book.metadataChecks}/5 bloc(s) prets</span>
                        <span>{book.formatCount} format(s)</span>
                        <span>{book.publishedFormats} format(s) actifs</span>
                        <span>{book.planCount} plan(s) Premium</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/dashboard/author/books/${book.id}/edit`}
                        className="inline-flex h-11 items-center gap-2 rounded-full bg-[#171717] px-4 text-sm font-semibold text-white transition hover:bg-[#0f172a]"
                      >
                        Modifier
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <div className="rounded-[18px] border border-[#ece3d7] bg-white px-4 py-3">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#8b8177]">Vues</p>
                      <p className="mt-2 text-lg font-semibold text-[#171717]">{book.views_count}</p>
                    </div>
                    <div className="rounded-[18px] border border-[#ece3d7] bg-white px-4 py-3">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#8b8177]">Achats</p>
                      <p className="mt-2 text-lg font-semibold text-[#171717]">{book.purchases_count}</p>
                    </div>
                    <div className="rounded-[18px] border border-[#ece3d7] bg-white px-4 py-3">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#8b8177]">Prix</p>
                      <p className="mt-2 text-lg font-semibold text-[#171717]">{formatCurrency(Number(book.price ?? 0), book.currency_code ?? "USD")}</p>
                    </div>
                    <div className="rounded-[18px] border border-[#ece3d7] bg-white px-4 py-3">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#8b8177]">Note</p>
                      <p className="mt-2 text-lg font-semibold text-[#171717]">
                        {book.rating_avg ? `${book.rating_avg.toFixed(1)}/5` : "Aucune"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-[#6f665e]">
                    <span className="rounded-full bg-white px-3 py-1 ring-1 ring-[#ece3d7]">
                      Vente unitaire {book.is_single_sale_enabled ? "active" : "inactive"}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 ring-1 ring-[#ece3d7]">
                      Premium {book.is_subscription_available ? "actif" : "inactif"}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 ring-1 ring-[#ece3d7]">
                      Mise a jour {formatShortDate(book.updated_at)}
                    </span>
                  </div>

                  {book.review_note ? (
                    <div className="mt-4 rounded-[18px] border border-[#f0dccd] bg-[#fff7f0] p-4 text-sm leading-6 text-[#6f665e]">
                      <span className="font-semibold text-[#171717]">Retour admin:</span> {book.review_note}
                    </div>
                  ) : null}
                </article>
              ))
            ) : (
              <EmptyState
                title="Aucun titre pour le moment"
                description="Ajoutez votre premier livre pour commencer a structurer votre studio auteur."
                action={
                  <Link
                    href="/dashboard/author/add-book"
                    className="inline-flex h-11 items-center justify-center rounded-full bg-[#171717] px-4 text-sm font-semibold text-white transition hover:bg-[#0f172a]"
                  >
                    Ajouter un livre
                  </Link>
                }
              />
            )}
          </div>
        </section>

        <div className="grid gap-4">
          <section className="rounded-[30px] border border-[#e7ddd1] bg-white/95 p-5 shadow-[0_22px_50px_rgba(15,23,42,0.05)]">
            <div className="space-y-2">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#a85b3f]">Profil auteur</p>
              <h2 className="text-[1.3rem] font-semibold tracking-[-0.04em] text-[#171717]">Presence editeur</h2>
            </div>
            <div className="mt-4 rounded-[22px] border border-[#ece3d7] bg-[#fcfaf7] p-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#8b8177]">Completion</p>
              <p className="mt-2 text-[1.9rem] font-semibold tracking-[-0.04em] text-[#171717]">{profileScore}%</p>
              <p className="mt-2 text-sm text-[#6f665e]">
                {completedProfileFields}/{profileFields.length} blocs profil sont deja remplis.
              </p>
            </div>
            <div className="mt-3 grid gap-2">
              {missingProfileFields.length > 0 ? (
                missingProfileFields.map((field) => (
                  <div key={field} className="rounded-[18px] border border-[#ece3d7] bg-white px-4 py-3 text-sm text-[#4f4740]">
                    A completer: <span className="font-semibold text-[#171717]">{field}</span>
                  </div>
                ))
              ) : (
                <div className="rounded-[18px] border border-[#d8eadf] bg-[#eefaf2] px-4 py-3 text-sm text-[#237a43]">
                  Profil auteur complet pour le front office.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[30px] border border-[#e7ddd1] bg-white/95 p-5 shadow-[0_22px_50px_rgba(15,23,42,0.05)]">
            <div className="space-y-2">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#a85b3f]">Monetisation</p>
              <h2 className="text-[1.3rem] font-semibold tracking-[-0.04em] text-[#171717]">Canaux actifs</h2>
            </div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-[22px] border border-[#ece3d7] bg-[#fcfaf7] p-4">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#8b8177]">Vente unitaire</p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#171717]">{singleSaleEnabledCount} titre(s)</p>
              </div>
              <div className="rounded-[22px] border border-[#ece3d7] bg-[#fcfaf7] p-4">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#8b8177]">Premium</p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#171717]">{premiumEnabledCount} titre(s)</p>
              </div>
              <div className="rounded-[22px] border border-[#ece3d7] bg-[#fcfaf7] p-4">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#8b8177]">Publies</p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#171717]">{publishedBooks} titre(s)</p>
              </div>
              <div className="rounded-[22px] border border-[#ece3d7] bg-[#fcfaf7] p-4">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#8b8177]">Brouillons</p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#171717]">{draftBooks} titre(s)</p>
              </div>
            </div>
          </section>

          <section className="rounded-[30px] border border-[#171717] bg-[#171717] p-5 text-white shadow-[0_26px_60px_rgba(15,23,42,0.18)]">
            <div className="space-y-3">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#ffd9cd]">Audience snapshot</p>
              <h2 className="text-[1.9rem] font-semibold tracking-[-0.05em] text-white">{uniqueReaders} lecteurs uniques</h2>
              <p className="text-sm leading-7 text-white/72">
                {strongestBook
                  ? `${strongestBook.title} mene actuellement avec ${strongestBook.views_count} vues et ${strongestBook.purchases_count} achats.`
                  : "Les signaux audience apparaitront ici des qu un titre commencera a circuler."}
              </p>
              <div className="grid gap-3 pt-2">
                <div className="rounded-[18px] bg-white/8 px-4 py-3 text-sm text-white/84">Lectures gratuites: {freeClaims}</div>
                <div className="rounded-[18px] bg-white/8 px-4 py-3 text-sm text-white/84">Lectures Premium: {subscriptionClaims}</div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <section className="rounded-[30px] border border-[#e7ddd1] bg-white/95 p-5 shadow-[0_22px_50px_rgba(15,23,42,0.05)] sm:p-6">
        <div className="flex flex-col gap-3 border-b border-[#f1e8de] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#a85b3f]">Lecteurs recents</p>
            <h2 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-[#171717]">Dernieres acquisitions</h2>
            <p className="text-sm leading-7 text-[#6f665e]">
              Les derniers lecteurs rattaches a vos livres, avec le canal exact d acces.
            </p>
          </div>
          <Link
            href="/dashboard/author/sales"
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#e7ddd1] bg-[#fcfaf7] px-4 text-sm font-semibold text-[#26221d] transition hover:border-[#d5c8bb] hover:bg-white"
          >
            Voir les ventes
          </Link>
        </div>

        <div className="mt-5 grid gap-3">
          {recentReaders.length > 0 ? (
            recentReaders.map((entry, index) => {
              const buyer = firstOf(entry.profiles);
              const book = books.find((candidate) => candidate.id === entry.book_id);

              return (
                <article
                  key={`${entry.user_id}-${entry.book_id}-${entry.purchased_at}-${index}`}
                  className="flex flex-col gap-4 rounded-[24px] border border-[#ece3d7] bg-[#fcfaf7] p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#fff1ea] px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-[#a85b3f]">
                        Lecteur {index + 1}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-[#6f665e]">
                        {getLibraryAccessLabel(entry.access_type)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#171717]">{buyer?.name ?? "Lecteur"}</p>
                      <p className="text-sm text-[#6f665e]">{buyer?.email ?? "email indisponible"}</p>
                    </div>
                    <p className="text-sm leading-6 text-[#4f4740]">
                      <span className="font-medium text-[#171717]">{book?.title ?? "Livre"}</span> ajoute le {formatShortDate(entry.purchased_at)}
                    </p>
                  </div>

                  <div className="rounded-[18px] border border-[#ece3d7] bg-white px-4 py-3 text-right">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#8b8177]">Canal</p>
                    <p className="mt-1 text-sm font-semibold text-[#171717]">{getLibraryAccessLabel(entry.access_type)}</p>
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState
              title="Aucun lecteur visible"
              description="Les acquisitions recentes de vos titres apparaitront ici des que des ventes ou acces commenceront a remonter."
            />
          )}
        </div>
      </section>
    </section>
  );
}
