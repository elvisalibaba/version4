import Link from "next/link";
import { ArrowRight, BookOpen, Compass, Gem, LibraryBig, Star } from "lucide-react";
import { DashboardTopbar } from "@/components/ui/dashboard-topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { getLibraryAccessLabel } from "@/lib/access-labels";
import { requireRole } from "@/lib/auth";
import { isSubscriptionCurrentlyActive } from "@/lib/book-access";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type MaybeArray<T> = T | T[] | null;

type LibraryEntry = {
  book_id: string;
  purchased_at: string;
  access_type: Database["public"]["Tables"]["library"]["Row"]["access_type"];
  subscription_id: string | null;
  books:
    | {
        id: string;
        title: string;
        description: string | null;
        cover_url: string | null;
        price: number;
        categories: string[];
        rating_avg: number | null;
        status: Database["public"]["Tables"]["books"]["Row"]["status"];
        copyright_status: Database["public"]["Tables"]["books"]["Row"]["copyright_status"];
      }
    | {
        id: string;
        title: string;
        description: string | null;
        cover_url: string | null;
        price: number;
        categories: string[];
        rating_avg: number | null;
        status: Database["public"]["Tables"]["books"]["Row"]["status"];
        copyright_status: Database["public"]["Tables"]["books"]["Row"]["copyright_status"];
      }[]
    | null;
  user_subscriptions:
    | { status: Database["public"]["Tables"]["user_subscriptions"]["Row"]["status"]; expires_at: string | null; subscription_plans: MaybeArray<{ name: string }> }
    | { status: Database["public"]["Tables"]["user_subscriptions"]["Row"]["status"]; expires_at: string | null; subscription_plans: MaybeArray<{ name: string }> }[]
    | null;
};

function firstOf<T>(value: MaybeArray<T>) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function ReaderLibraryPage() {
  const profile = await requireRole(["reader"]);
  const supabase = await createClient();

  const { data: library } = await supabase
    .from("library")
    .select(
      "book_id, purchased_at, access_type, subscription_id, books:book_id(id, title, description, cover_url, price, categories, rating_avg, status, copyright_status), user_subscriptions:subscription_id(status, expires_at, subscription_plans!user_subscriptions_plan_id_fkey(name))",
    )
    .eq("user_id", profile.id)
    .order("purchased_at", { ascending: false })
    .returns<LibraryEntry[]>();

  const items = (library ?? []) as LibraryEntry[];
  const totalBooks = items.length;
  const purchaseBooks = items.filter((item) => item.access_type === "purchase").length;
  const subscriptionBooks = items.filter((item) => item.access_type === "subscription").length;
  const freeBooks = items.filter((item) => item.access_type === "free").length;
  const avgRatingSource = items
    .map((item) => {
      const book = Array.isArray(item.books) ? item.books[0] : item.books;
      return book?.rating_avg ?? null;
    })
    .filter((rating): rating is number => rating !== null);
  const avgRating = avgRatingSource.length ? avgRatingSource.reduce((sum, rating) => sum + rating, 0) / avgRatingSource.length : null;

  return (
    <section className="space-y-6">
      <DashboardTopbar
        kicker="Personal library"
        title={`Une bibliotheque plus lisible pour ${profile.name ?? profile.email}`}
        description="Tous vos titres acquis, gratuits, payants et Premium, dans une seule grille claire avec le bon statut d acces."
        actions={
          <>
            <Link href="/books" className="cta-primary px-5 py-3 text-sm">
              <Compass className="h-4 w-4" />
              Explorer la librairie
            </Link>
            <Link href="/dashboard/reader/subscriptions" className="cta-secondary px-5 py-3 text-sm">
              <Gem className="h-4 w-4" />
              Voir Premium
            </Link>
          </>
        }
      />

      <div className="metric-grid">
        <StatCard icon={LibraryBig} label="Bibliotheque" value={totalBooks} description="Livres deja debloques" tone="violet" />
        <StatCard icon={Gem} label="Premium" value={subscriptionBooks} description="Titres relies a un abonnement" tone="sky" />
        <StatCard icon={BookOpen} label="Achats" value={purchaseBooks} description="Titres achetes dans votre compte" tone="amber" />
        <StatCard icon={Star} label="Note moyenne" value={avgRating ? avgRating.toFixed(1) : "--"} description="Sur les livres notes" tone="emerald" />
      </div>

      <section className="surface-panel p-6">
        <div className="section-header">
          <div className="space-y-2">
            <p className="section-kicker">Library grid</p>
            <h2 className="section-title text-2xl">Mes livres</h2>
            <p className="section-description">Tous les titres acquis, gratuits, payants et Premium confondus.</p>
          </div>
          <span className="catalog-badge">{totalBooks} titres</span>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {items.length > 0 ? (
            items.map((item) => {
              const book = Array.isArray(item.books) ? item.books[0] : item.books;
              const subscription = firstOf(item.user_subscriptions);
              const hasActiveSubscription = item.access_type !== "subscription" || isSubscriptionCurrentlyActive(subscription ?? null);
              const planName = firstOf(subscription?.subscription_plans)?.name ?? null;
              const isTemporarilyUnavailable = !book || book.status !== "published" || book.copyright_status === "blocked";

              return (
                <article
                  key={item.book_id}
                  className="group rounded-[1.75rem] border border-violet-100 bg-[linear-gradient(135deg,_rgba(255,255,255,0.95),_rgba(244,239,255,0.92))] p-5 transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.25rem] bg-[linear-gradient(135deg,_#7a63ff,_#624df1)] text-lg font-bold text-white shadow-md">
                      {(book?.title ?? "HB").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-lg font-semibold text-slate-950">{book?.title ?? "Titre indisponible"}</p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isTemporarilyUnavailable
                              ? "bg-rose-100 text-rose-700"
                              : item.access_type === "subscription"
                              ? hasActiveSubscription
                                ? "bg-indigo-100 text-indigo-700"
                                : "bg-rose-100 text-rose-700"
                              : item.access_type === "free"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-sky-100 text-sky-700"
                          }`}
                        >
                          {isTemporarilyUnavailable ? "Indisponible" : getLibraryAccessLabel(item.access_type, hasActiveSubscription)}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                        {book?.description ?? "Pret a etre relu quand vous voulez."}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span>Ajoute le {new Date(item.purchased_at).toLocaleDateString("fr-FR")}</span>
                        {planName ? <span>{planName}</span> : null}
                        {book?.categories?.[0] ? <span>{book.categories[0]}</span> : null}
                        {book?.rating_avg ? <span>{book.rating_avg.toFixed(1)}/5</span> : null}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-700">
                      {isTemporarilyUnavailable
                        ? "Diffusion suspendue par l equipe admin"
                        : item.access_type === "subscription" && !hasActiveSubscription
                          ? "Acces suspendu"
                          : getLibraryAccessLabel(item.access_type, hasActiveSubscription)}
                    </p>
                    {isTemporarilyUnavailable ? (
                      <span className="cta-secondary px-4 py-2 text-sm">En attente de reactivation</span>
                    ) : item.access_type === "subscription" && !hasActiveSubscription ? (
                      <Link href="/dashboard/reader/subscriptions" className="cta-secondary px-4 py-2 text-sm">
                        Reprendre Premium
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <Link href={`/book/${item.book_id}`} className="cta-primary px-4 py-2 text-sm">
                        Ouvrir
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState
              title="Aucun livre dans la bibliotheque"
              description="Les titres acquis ou debloques via Premium apparaitront ici avec le bon type d acces."
              action={
                <Link href="/books" className="cta-secondary px-5 py-3 text-sm">
                  Explorer le catalogue
                </Link>
              }
            />
          )}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="surface-panel-soft p-5">
          <p className="text-sm font-semibold text-slate-950">Achats payants</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{purchaseBooks}</p>
        </div>
        <div className="surface-panel-soft p-5">
          <p className="text-sm font-semibold text-slate-950">Acces Premium</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{subscriptionBooks}</p>
        </div>
        <div className="surface-panel-soft p-5">
          <p className="text-sm font-semibold text-slate-950">Livres gratuits</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{freeBooks}</p>
        </div>
      </div>
    </section>
  );
}
