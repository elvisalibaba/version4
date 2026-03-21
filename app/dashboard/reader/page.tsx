import Link from "next/link";
import { ArrowRight, BookOpen, CircleDollarSign, Clock3, LibraryBig, Receipt, Sparkles, Star } from "lucide-react";
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

type ReaderAffiliateSummary = Pick<
  Database["public"]["Tables"]["reader_affiliate_profiles"]["Row"],
  "affiliate_code" | "wallet_balance" | "currency_code"
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

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function ReaderDashboardPage() {
  const profile = await requireRole(["reader"]);
  const supabase = await createClient();

  const [{ data: library }, { data: orders }, { data: subscriptions }, { data: affiliateProfile }] = await Promise.all([
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
      .select("id, status, expires_at, subscription_plans!user_subscriptions_plan_id_fkey(name, slug)")
      .order("created_at", { ascending: false })
      .returns<SubscriptionRow[]>(),
    supabase
      .from("reader_affiliate_profiles")
      .select("affiliate_code, wallet_balance, currency_code")
      .eq("user_id", profile.id)
      .returns<ReaderAffiliateSummary>()
      .maybeSingle(),
  ]);

  const libraryItems = (library ?? []) as LibraryPreview[];
  const orderRows = (orders ?? []) as OrderRow[];
  const subscriptionRows = (subscriptions ?? []) as SubscriptionRow[];
  const affiliateSummary = (affiliateProfile ?? null) as ReaderAffiliateSummary | null;

  const paidOrders = orderRows.filter((order) => order.payment_status === "paid");
  const totalSpent = paidOrders.reduce((sum, order) => sum + order.total_price, 0);
  const averageTicket = paidOrders.length > 0 ? totalSpent / paidOrders.length : 0;
  const purchaseBooks = libraryItems.filter((item) => item.access_type === "purchase").length;
  const subscriptionBooks = libraryItems.filter((item) => item.access_type === "subscription").length;
  const freeBooks = libraryItems.filter((item) => item.access_type === "free").length;
  const recentBooks = libraryItems.slice(0, 4);
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
        description="Reprenez la lecture, surveillez vos achats et gardez un oeil sur vos abonnements depuis un espace plus lisible."
        actions={
          <>
            <Link
              href="/dashboard/reader/library"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[#171717] px-4 text-sm font-semibold text-white transition hover:bg-[#0f172a]"
            >
              <LibraryBig className="h-4 w-4" />
              Ouvrir ma bibliotheque
            </Link>
            <Link
              href="/dashboard/reader/subscriptions"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-[#e7ddd1] bg-white px-4 text-sm font-semibold text-[#26221d] transition hover:border-[#d5c8bb]"
            >
              <Receipt className="h-4 w-4" />
              Voir Premium
            </Link>
            <Link
              href="/dashboard/reader/affiliations"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-[#e7ddd1] bg-white px-4 text-sm font-semibold text-[#26221d] transition hover:border-[#d5c8bb]"
            >
              <CircleDollarSign className="h-4 w-4" />
              Mes affiliations
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BookOpen} label="Achats" value={purchaseBooks} description="Titres achetes a l unite" tone="amber" />
        <StatCard icon={Receipt} label="Premium" value={subscriptionBooks} description="Livres ouverts via abonnement" tone="violet" />
        <StatCard icon={Star} label="Gratuits" value={freeBooks} description="Titres debloques sans paiement" tone="emerald" />
        <StatCard icon={Clock3} label="Plans actifs" value={activeSubscriptions.length} description="Abonnements en cours" tone="sky" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <section className="rounded-[30px] border border-[#e7ddd1] bg-white/95 p-5 shadow-[0_22px_50px_rgba(15,23,42,0.05)] sm:p-6">
          <div className="flex flex-col gap-3 border-b border-[#f1e8de] pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#a85b3f]">Continue reading</p>
              <h2 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-[#171717]">Reprendre une lecture</h2>
              <p className="text-sm leading-7 text-[#6f665e]">Vos derniers titres avec le bon type d acces et un raccourci direct vers la fiche.</p>
            </div>
            <Link
              href="/dashboard/reader/purchases"
              className="inline-flex h-11 items-center justify-center rounded-full border border-[#e7ddd1] bg-[#fcfaf7] px-4 text-sm font-semibold text-[#26221d] transition hover:border-[#d5c8bb] hover:bg-white"
            >
              Voir l historique
            </Link>
          </div>

          <div className="mt-5 grid gap-3">
            {recentBooks.length > 0 ? (
              recentBooks.map((item, index) => {
                const book = Array.isArray(item.books) ? item.books[0] : item.books;
                const category = book?.categories?.[0] ?? "Catalogue";

                return (
                  <article
                    key={item.book_id}
                    className="flex flex-col gap-4 rounded-[24px] border border-[#ece3d7] bg-[#fcfaf7] p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] bg-[#171717] text-sm font-semibold text-white">
                        {(book?.title ?? "HB").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#fff1ea] px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-[#a85b3f]">
                            Lecture {index + 1}
                          </span>
                          <span className="rounded-full bg-white px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-[#6f665e]">
                            {getLibraryAccessLabel(item.access_type)}
                          </span>
                        </div>
                        <div>
                          <p className="text-lg font-semibold tracking-[-0.03em] text-[#171717]">{book?.title ?? "Titre indisponible"}</p>
                          <p className="text-sm leading-6 text-[#6f665e]">
                            {category} • ajoute le {formatShortDate(item.purchased_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/book/${item.book_id}`}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#171717] px-4 text-sm font-semibold text-white transition hover:bg-[#0f172a]"
                    >
                      Ouvrir
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </article>
                );
              })
            ) : (
              <EmptyState
                title="Votre bibliotheque est encore vide"
                description="Vos prochains achats ou acces Premium apparaitront ici pour reprendre la lecture en un clic."
                action={
                  <Link
                    href="/books"
                    className="inline-flex h-11 items-center justify-center rounded-full bg-[#171717] px-4 text-sm font-semibold text-white transition hover:bg-[#0f172a]"
                  >
                    Explorer le catalogue
                  </Link>
                }
              />
            )}
          </div>
        </section>

        <div className="grid gap-4">
          <section className="rounded-[30px] border border-[#e7ddd1] bg-white/95 p-5 shadow-[0_22px_50px_rgba(15,23,42,0.05)]">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#a85b3f]">Compte</p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-[22px] border border-[#ece3d7] bg-[#fcfaf7] p-4">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#8b8177]">Derniere acquisition</p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#171717]">{lastAcquisitionDate}</p>
              </div>
              <div className="rounded-[22px] border border-[#ece3d7] bg-[#fcfaf7] p-4">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#8b8177]">Categorie dominante</p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#171717]">{favoriteCategory}</p>
              </div>
              <div className="rounded-[22px] border border-[#ece3d7] bg-[#fcfaf7] p-4">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#8b8177]">Panier moyen</p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#171717]">{formatCurrency(averageTicket)}</p>
              </div>
              <Link
                href="/dashboard/reader/affiliations"
                className="rounded-[22px] border border-[#ece3d7] bg-[#fcfaf7] p-4 transition hover:border-[#d5c8bb] hover:bg-white"
              >
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#8b8177]">Affiliation</p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#171717]">
                  {formatCurrency(affiliateSummary?.wallet_balance ?? 0, affiliateSummary?.currency_code ?? "USD")}
                </p>
                <p className="mt-2 text-sm leading-6 text-[#6f665e]">
                  {affiliateSummary?.affiliate_code ? `Code ${affiliateSummary.affiliate_code}` : "Votre portefeuille lecteur est pret."}
                </p>
              </Link>
            </div>
          </section>

          <section className="rounded-[30px] border border-[#e7ddd1] bg-white/95 p-5 shadow-[0_22px_50px_rgba(15,23,42,0.05)]">
            <div className="space-y-2">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#a85b3f]">Premium</p>
              <h2 className="text-[1.3rem] font-semibold tracking-[-0.04em] text-[#171717]">Plans actifs</h2>
            </div>
            <div className="mt-4 grid gap-3">
              {activeSubscriptions.length > 0 ? (
                activeSubscriptions.map((subscription) => {
                  const plan = firstOf(subscription.subscription_plans);

                  return (
                    <article key={subscription.id} className="rounded-[22px] border border-[#ece3d7] bg-[#fcfaf7] p-4">
                      <p className="text-sm font-semibold text-[#171717]">{plan?.name ?? "Plan Premium"}</p>
                      <p className="mt-1 text-sm text-[#6f665e]">{plan?.slug ?? "premium"}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[#8b8177]">
                        {subscription.expires_at ? `Expire le ${formatShortDate(subscription.expires_at)}` : "Sans date de fin"}
                      </p>
                    </article>
                  );
                })
              ) : (
                <EmptyState title="Aucun abonnement actif" description="Vos futurs packs Premium apparaitront ici." />
              )}
            </div>
          </section>

          <section className="rounded-[30px] border border-[#171717] bg-[#171717] p-5 text-white shadow-[0_26px_60px_rgba(15,23,42,0.18)]">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#ffd9cd]">
                <Sparkles className="h-5 w-5" />
              </span>
              <div className="space-y-2">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#ffd9cd]">Budget lecture</p>
                <h2 className="text-[2rem] font-semibold tracking-[-0.05em] text-white">{formatCurrency(totalSpent)}</h2>
                <p className="text-sm leading-7 text-white/72">
                  Montant cumule sur les commandes payees. Les lectures via abonnement restent comptees a part.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
