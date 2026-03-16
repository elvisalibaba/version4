import Link from "next/link";
import { ArrowRight, BookOpen, Clock3, LibraryBig, Receipt, Sparkles, Star } from "lucide-react";
import { DashboardTopbar } from "@/components/ui/dashboard-topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { getLibraryAccessLabel } from "@/lib/access-labels";
import { requireRole } from "@/lib/auth";
import { isSubscriptionCurrentlyActive } from "@/lib/book-access";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type MaybeArray<T> = T | T[] | null;

type LibraryPreview = {
  book_id: string;
  purchased_at: string;
  access_type: Database["public"]["Tables"]["library"]["Row"]["access_type"];
  books:
    | { id: string; title: string; categories: string[]; cover_url: string | null; rating_avg: number | null }
    | { id: string; title: string; categories: string[]; cover_url: string | null; rating_avg: number | null }[]
    | null;
};

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

type SubscriptionRow = Pick<
  Database["public"]["Tables"]["user_subscriptions"]["Row"],
  "id" | "status" | "expires_at"
> & {
  subscription_plans: MaybeArray<{ name: string; slug: string }>;
};

function firstOf<T>(value: MaybeArray<T>) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

export default async function ReaderDashboardPage() {
  const profile = await requireRole(["reader"]);
  const supabase = await createClient();

  const [{ data: library }, { data: orders }, { data: subscriptions }] = await Promise.all([
    supabase
      .from("library")
      .select("book_id, purchased_at, access_type, books:book_id(id, title, categories, cover_url, rating_avg)")
      .order("purchased_at", { ascending: false })
      .returns<LibraryPreview[]>(),
    supabase
      .from("orders")
      .select("id, total_price, payment_status, created_at, currency_code")
      .order("created_at", { ascending: false })
      .returns<OrderRow[]>(),
    supabase
      .from("user_subscriptions")
      .select("id, status, expires_at, subscription_plans(name, slug)")
      .order("created_at", { ascending: false })
      .returns<SubscriptionRow[]>(),
  ]);

  const libraryItems = (library ?? []) as LibraryPreview[];
  const orderRows = (orders ?? []) as OrderRow[];
  const subscriptionRows = (subscriptions ?? []) as SubscriptionRow[];

  const paidOrders = orderRows.filter((order) => order.payment_status === "paid");
  const totalSpent = paidOrders.reduce((sum, order) => sum + order.total_price, 0);
  const averageTicket = paidOrders.length > 0 ? totalSpent / paidOrders.length : 0;
  const purchaseBooks = libraryItems.filter((item) => item.access_type === "purchase").length;
  const subscriptionBooks = libraryItems.filter((item) => item.access_type === "subscription").length;
  const freeBooks = libraryItems.filter((item) => item.access_type === "free").length;
  const recentBooks = libraryItems.slice(0, 3);
  const activeSubscriptions = subscriptionRows.filter((subscription) => isSubscriptionCurrentlyActive(subscription));
  const lastAcquisitionDate = libraryItems[0]?.purchased_at
    ? new Date(libraryItems[0].purchased_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Aucune acquisition pour le moment";

  const categoryCounts = new Map<string, number>();
  for (const item of libraryItems) {
    const book = Array.isArray(item.books) ? item.books[0] : item.books;
    for (const category of book?.categories ?? []) {
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    }
  }

  const favoriteCategory = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "A explorer";

  return (
    <section className="space-y-6">
      <DashboardTopbar
        kicker="Reader dashboard"
        title={`Bonjour ${profile.name ?? profile.email}`}
        description="Votre espace lecteur rassemble les achats, les livres Premium et les lectures gratuites dans une experience plus editoriale."
        actions={
          <>
            <Link href="/dashboard/reader/library" className="cta-primary px-5 py-3 text-sm">
              <LibraryBig className="h-4 w-4" />
              Ouvrir ma bibliotheque
            </Link>
            <Link href="/dashboard/reader/subscriptions" className="cta-secondary px-5 py-3 text-sm">
              <Receipt className="h-4 w-4" />
              Voir Premium
            </Link>
          </>
        }
      />

      <div className="metric-grid">
        <StatCard icon={BookOpen} label="Achats" value={purchaseBooks} description="Titres achetes a l unite" tone="amber" />
        <StatCard icon={Receipt} label="Premium" value={subscriptionBooks} description="Livres ouverts via abonnement" tone="violet" />
        <StatCard icon={Star} label="Gratuits" value={freeBooks} description="Titres debloques sans paiement" tone="emerald" />
        <StatCard icon={Clock3} label="Plans actifs" value={activeSubscriptions.length} description="Abonnements Premium en cours" tone="sky" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="surface-panel p-6">
          <div className="section-header">
            <div className="space-y-2">
              <p className="section-kicker">Continue reading</p>
              <h2 className="section-title text-2xl">Reprendre la lecture</h2>
              <p className="section-description">Vos derniers titres avec leur type d acces reel.</p>
            </div>
            <Link href="/dashboard/reader/library" className="cta-secondary px-4 py-2 text-sm">
              Tout voir
            </Link>
          </div>

          <div className="mt-5 grid gap-3">
            {recentBooks.length > 0 ? (
              recentBooks.map((item, index) => {
                const book = Array.isArray(item.books) ? item.books[0] : item.books;

                return (
                  <article
                    key={item.book_id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-violet-100 bg-[linear-gradient(135deg,_rgba(255,255,255,0.95),_rgba(244,239,255,0.92))] p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-[linear-gradient(135deg,_#7a63ff,_#624df1)] text-lg font-bold text-white shadow-lg">
                        {(book?.title ?? "HB").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-500">Lecture {index + 1}</p>
                        <p className="mt-1 text-lg font-semibold text-slate-950">{book?.title ?? "Titre indisponible"}</p>
                        <div className="mt-1 flex flex-wrap gap-2 text-sm text-slate-500">
                          <span>{getLibraryAccessLabel(item.access_type)}</span>
                          <span>Ajoute le {new Date(item.purchased_at).toLocaleDateString("fr-FR")}</span>
                        </div>
                      </div>
                    </div>
                    <Link href={`/book/${item.book_id}`} className="cta-primary px-5 py-3 text-sm">
                      Lire
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </article>
                );
              })
            ) : (
              <EmptyState
                title="Votre bibliotheque est encore vide"
                description="Vos prochains achats ou acces Premium apparaitront ici pour reprendre la lecture en un clic."
              />
            )}
          </div>
        </section>

        <div className="grid gap-5">
          <section className="surface-panel-soft p-5">
            <p className="section-kicker">Collection pulse</p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-[1.35rem] bg-white/90 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Derniere acquisition</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{lastAcquisitionDate}</p>
              </div>
              <div className="rounded-[1.35rem] bg-white/90 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Categorie forte</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{favoriteCategory}</p>
              </div>
              <div className="rounded-[1.35rem] bg-white/90 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Panier moyen</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{formatCurrency(averageTicket)}</p>
              </div>
            </div>
          </section>

          <section className="surface-panel p-5">
            <div className="section-header">
              <div className="space-y-2">
                <p className="section-kicker">Premium</p>
                <h2 className="section-title text-2xl">Plans actifs</h2>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              {activeSubscriptions.length > 0 ? (
                activeSubscriptions.map((subscription) => {
                  const plan = firstOf(subscription.subscription_plans);
                  return (
                    <article key={subscription.id} className="rounded-[1.35rem] bg-violet-50/80 p-4">
                      <p className="font-semibold text-slate-950">{plan?.name ?? "Plan Premium"}</p>
                      <p className="mt-1 text-sm text-slate-500">{plan?.slug ?? "premium"}</p>
                    </article>
                  );
                })
              ) : (
                <EmptyState title="Aucun abonnement actif" description="Vos futurs packs Premium apparaitront ici." />
              )}
            </div>
          </section>

          <section className="surface-panel-soft p-5">
            <p className="section-kicker">
              <Sparkles className="h-3.5 w-3.5" />
              Budget lecture
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950">{formatCurrency(totalSpent)}</h2>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              Montant total depense sur les commandes payees. Les acces Premium sont suivis a part.
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}
