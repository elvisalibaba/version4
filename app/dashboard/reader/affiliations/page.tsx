import Link from "next/link";
import { ArrowRight, CircleDollarSign, Gem, Percent, Users } from "lucide-react";
import { AffiliateLinkCard } from "@/components/reader/affiliate-link-card";
import { DashboardTopbar } from "@/components/ui/dashboard-topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { buildAffiliateRegisterPath } from "@/lib/affiliate";
import { requireRole } from "@/lib/auth";
import { formatMoney } from "@/lib/book-offers";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type MaybeArray<T> = T | T[] | null;

type ReaderAffiliateProfileRow = Pick<
  Database["public"]["Tables"]["reader_affiliate_profiles"]["Row"],
  "affiliate_code" | "commission_rate" | "wallet_balance" | "lifetime_credited" | "currency_code" | "is_active"
>;

type AffiliateTransactionRow = Pick<
  Database["public"]["Tables"]["affiliate_wallet_transactions"]["Row"],
  "id" | "source_type" | "commission_amount" | "currency_code" | "created_at"
> & {
  referred_user: MaybeArray<Pick<Database["public"]["Tables"]["profiles"]["Row"], "name" | "email">>;
  plan: MaybeArray<Pick<Database["public"]["Tables"]["subscription_plans"]["Row"], "name" | "slug">>;
  source_book: MaybeArray<Pick<Database["public"]["Tables"]["books"]["Row"], "title">>;
  source_plan: MaybeArray<Pick<Database["public"]["Tables"]["subscription_plans"]["Row"], "name" | "slug">>;
};

type AffiliateOrderTransactionRow = Pick<
  Database["public"]["Tables"]["affiliate_order_transactions"]["Row"],
  | "id"
  | "referral_source_type"
  | "commission_amount"
  | "currency_code"
  | "created_at"
> & {
  referred_user: MaybeArray<Pick<Database["public"]["Tables"]["profiles"]["Row"], "name" | "email">>;
  purchased_book: MaybeArray<Pick<Database["public"]["Tables"]["books"]["Row"], "title">>;
  referral_book: MaybeArray<Pick<Database["public"]["Tables"]["books"]["Row"], "title">>;
  referral_plan: MaybeArray<Pick<Database["public"]["Tables"]["subscription_plans"]["Row"], "name" | "slug">>;
};

type ShareBookRow = Pick<Database["public"]["Tables"]["books"]["Row"], "id" | "title">;
type SharePlanRow = Pick<Database["public"]["Tables"]["subscription_plans"]["Row"], "id" | "name" | "slug">;

type AffiliateCreditItem = {
  id: string;
  created_at: string;
  commission_amount: number;
  currency_code: string;
  badgeLabel: string;
  referredUserLabel: string;
  detailLabel: string;
};

const FALLBACK_APP_URL = "https://holistique-books.com";

function firstOf<T>(value: MaybeArray<T>) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function resolveAppBaseUrl() {
  const rawCandidate = process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.APP_BASE_URL?.trim() || FALLBACK_APP_URL;

  try {
    const parsed = new URL(rawCandidate);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed;
    }
  } catch {
    return new URL(FALLBACK_APP_URL);
  }

  return new URL(FALLBACK_APP_URL);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ReaderAffiliationsPage() {
  const profile = await requireRole(["reader"]);
  const supabase = await createClient();
  const appBaseUrl = resolveAppBaseUrl();

  const [
    { data: affiliateProfile },
    { data: recentTransactions },
    { count: creditedSubscriptionTransactions },
    { data: shareBook },
    { data: sharePlan },
    { data: recentOrderTransactions, error: affiliateOrderTransactionsError },
    { count: creditedOrderTransactions },
  ] =
    await Promise.all([
      supabase
        .from("reader_affiliate_profiles")
        .select("affiliate_code, commission_rate, wallet_balance, lifetime_credited, currency_code, is_active")
        .eq("user_id", profile.id)
        .returns<ReaderAffiliateProfileRow>()
        .maybeSingle(),
      supabase
        .from("affiliate_wallet_transactions")
        .select(
          "id, source_type, commission_amount, currency_code, created_at, referred_user:profiles!affiliate_wallet_transactions_referred_user_id_fkey(name, email), plan:subscription_plans!affiliate_wallet_transactions_plan_id_fkey(name, slug), source_book:books!affiliate_wallet_transactions_source_book_id_fkey(title), source_plan:subscription_plans!affiliate_wallet_transactions_source_plan_id_fkey(name, slug)",
        )
        .eq("affiliate_user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(8)
        .returns<AffiliateTransactionRow[]>(),
      supabase.from("affiliate_wallet_transactions").select("id", { count: "exact", head: true }).eq("affiliate_user_id", profile.id),
      supabase
        .from("books")
        .select("id, title")
        .eq("status", "published")
        .eq("is_subscription_available", true)
        .order("published_at", { ascending: false })
        .limit(1)
        .returns<ShareBookRow>()
        .maybeSingle(),
      supabase
        .from("subscription_plans")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("monthly_price", { ascending: true })
        .limit(1)
        .returns<SharePlanRow>()
        .maybeSingle(),
      supabase
        .from("affiliate_order_transactions")
        .select(
          "id, referral_source_type, commission_amount, currency_code, created_at, referred_user:profiles!affiliate_order_transactions_referred_user_id_fkey(name, email), purchased_book:books!affiliate_order_transactions_purchased_book_id_fkey(title), referral_book:books!affiliate_order_transactions_referral_source_book_id_fkey(title), referral_plan:subscription_plans!affiliate_order_transactions_referral_source_plan_id_fkey(name, slug)",
        )
        .eq("affiliate_user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(8)
        .returns<AffiliateOrderTransactionRow[]>(),
      supabase.from("affiliate_order_transactions").select("id", { count: "exact", head: true }).eq("affiliate_user_id", profile.id),
    ]);

  const wallet = (affiliateProfile ?? null) as ReaderAffiliateProfileRow | null;
  const bookShareCandidate = (shareBook ?? null) as ShareBookRow | null;
  const planShareCandidate = (sharePlan ?? null) as SharePlanRow | null;
  const transactions = (recentTransactions ?? []) as AffiliateTransactionRow[];
  const orderTransactions = affiliateOrderTransactionsError ? [] : ((recentOrderTransactions ?? []) as AffiliateOrderTransactionRow[]);
  const commissionRate = Math.round((wallet?.commission_rate ?? 0.02) * 100);
  const walletCurrency = wallet?.currency_code ?? "USD";
  const affiliateCode = wallet?.affiliate_code ?? "";
  const totalCredits = (creditedSubscriptionTransactions ?? 0) + (creditedOrderTransactions ?? 0);

  const genericShareUrl = new URL(
    buildAffiliateRegisterPath({ role: "reader", code: affiliateCode }),
    appBaseUrl,
  ).toString();
  const bookShareUrl = new URL(
    buildAffiliateRegisterPath({
      role: "reader",
      code: affiliateCode,
      sourceType: bookShareCandidate ? "book" : null,
      bookId: bookShareCandidate?.id ?? null,
    }),
    appBaseUrl,
  ).toString();
  const planShareUrl = new URL(
    buildAffiliateRegisterPath({
      role: "reader",
      code: affiliateCode,
      sourceType: planShareCandidate ? "plan" : null,
      planId: planShareCandidate?.id ?? null,
    }),
    appBaseUrl,
  ).toString();
  const normalizedSubscriptionCredits: AffiliateCreditItem[] = transactions.map((transaction) => {
    const referredUser = firstOf(transaction.referred_user);
    const plan = firstOf(transaction.plan);
    const sourceBook = firstOf(transaction.source_book);
    const sourcePlan = firstOf(transaction.source_plan);
    const sourceLabel =
      transaction.source_type === "book"
        ? sourceBook?.title ?? "Livre partage"
        : sourcePlan?.name ?? plan?.name ?? "Paquet partage";

    return {
      id: `subscription-${transaction.id}`,
      created_at: transaction.created_at,
      commission_amount: transaction.commission_amount,
      currency_code: transaction.currency_code,
      badgeLabel: transaction.source_type === "book" ? "Abonnement via livre" : "Abonnement via paquet",
      referredUserLabel: referredUser?.name ?? referredUser?.email ?? "Lecteur reference",
      detailLabel: `${plan?.name ?? "Abonnement Premium"} via ${sourceLabel}`,
    };
  });
  const normalizedOrderCredits: AffiliateCreditItem[] = orderTransactions.map((transaction) => {
    const referredUser = firstOf(transaction.referred_user);
    const purchasedBook = firstOf(transaction.purchased_book);
    const referralBook = firstOf(transaction.referral_book);
    const referralPlan = firstOf(transaction.referral_plan);
    const sourceLabel =
      transaction.referral_source_type === "book"
        ? referralBook?.title ?? "Livre partage"
        : transaction.referral_source_type === "plan"
          ? referralPlan?.name ?? "Paquet partage"
          : "Lien general";

    return {
      id: `order-${transaction.id}`,
      created_at: transaction.created_at,
      commission_amount: transaction.commission_amount,
      currency_code: transaction.currency_code,
      badgeLabel: "Achat livre",
      referredUserLabel: referredUser?.name ?? referredUser?.email ?? "Lecteur reference",
      detailLabel: `${purchasedBook?.title ?? "Livre achete"} via ${sourceLabel}`,
    };
  });
  const creditTimeline = [...normalizedSubscriptionCredits, ...normalizedOrderCredits]
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
    .slice(0, 8);

  return (
    <section className="space-y-6">
      <DashboardTopbar
        kicker="Affiliation"
        title="Mon portefeuille d affiliation"
        description="Chaque achat livre ou abonnement actif issu de votre code credite 2% dans votre portefeuille lecteur. Vous pouvez partager un lien global, un lien livre ou un lien paquet."
        actions={
          <>
            <Link href="/dashboard/reader/subscriptions" className="cta-secondary px-5 py-3 text-sm">
              Voir Premium
            </Link>
            <Link href="/books" className="cta-primary px-5 py-3 text-sm">
              Explorer les livres
              <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CircleDollarSign}
          label="Portefeuille"
          value={formatMoney(wallet?.wallet_balance ?? 0, walletCurrency)}
          description="Solde disponible sur vos affiliations"
          tone="emerald"
        />
        <StatCard
          icon={Gem}
          label="Credite a vie"
          value={formatMoney(wallet?.lifetime_credited ?? 0, walletCurrency)}
          description="Total cumule des commissions creditees"
          tone="violet"
        />
        <StatCard icon={Users} label="Credits" value={totalCredits} description="Achats et abonnements credites" tone="sky" />
        <StatCard icon={Percent} label="Taux" value={`${commissionRate} %`} description="Commission par conversion validee" tone="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <section className="rounded-[30px] border border-[#e7ddd1] bg-white/95 p-5 shadow-[0_22px_50px_rgba(15,23,42,0.05)] sm:p-6">
          <div className="space-y-2 border-b border-[#f1e8de] pb-5">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#a85b3f]">Liens de partage</p>
            <h2 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-[#171717]">Votre code {affiliateCode || "en cours"}</h2>
            <p className="text-sm leading-7 text-[#6f665e]">
              Partagez un lien simple d inscription. Quand un nouveau lecteur achete un livre ou active un abonnement ensuite, le portefeuille credite automatiquement {commissionRate} %.
            </p>
          </div>

          <div className="mt-5 grid gap-4">
            <AffiliateLinkCard
              label="Lien general lecteur"
              description="A utiliser pour une recommandation globale vers Holistique Books."
              href={genericShareUrl}
            />
            <AffiliateLinkCard
              label={bookShareCandidate ? `Lien livre: ${bookShareCandidate.title}` : "Lien livre"}
              description={
                bookShareCandidate
                  ? "Le lecteur arrive avec une attribution reliee a ce livre. Ses achats et abonnements futurs sont ensuite traces dans votre portefeuille."
                  : "Des qu un livre Premium est disponible, un lien partage livre apparaitra ici."
              }
              href={bookShareUrl}
            />
            <AffiliateLinkCard
              label={planShareCandidate ? `Lien paquet: ${planShareCandidate.name}` : "Lien paquet"}
              description={
                planShareCandidate
                  ? "Le lecteur arrive depuis ce paquet Premium et ses conversions payantes sont attribuees a votre code."
                  : "Des qu un paquet Premium est actif, un lien partage paquet apparaitra ici."
              }
              href={planShareUrl}
            />
          </div>
        </section>

        <div className="grid gap-4">
          <section className="rounded-[30px] border border-[#e7ddd1] bg-white/95 p-5 shadow-[0_22px_50px_rgba(15,23,42,0.05)]">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#a85b3f]">Mode de calcul</p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-[22px] border border-[#ece3d7] bg-[#fcfaf7] p-4">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#8b8177]">Type d affilie</p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#171717]">Lecteur ambassadeur</p>
              </div>
              <div className="rounded-[22px] border border-[#ece3d7] bg-[#fcfaf7] p-4">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#8b8177]">Declencheur</p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#171717]">Achat livre ou abonnement actif</p>
              </div>
              <div className="rounded-[22px] border border-[#ece3d7] bg-[#fcfaf7] p-4">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#8b8177]">Source suivie</p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#171717]">
                  {bookShareCandidate ? "Livre" : "Livre ou lien general"} + {planShareCandidate ? "paquet" : "paquet"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[30px] border border-[#171717] bg-[#171717] p-5 text-white shadow-[0_26px_60px_rgba(15,23,42,0.18)]">
            <div className="space-y-3">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#ffd9cd]">Activation</p>
              <h2 className="text-[1.65rem] font-semibold tracking-[-0.05em] text-white">Programme lecteur actif</h2>
              <p className="text-sm leading-7 text-white/72">
                Le schema garde maintenant la source d affiliation dans `profiles`, reporte l attribution dans `user_subscriptions`, suit les achats livres
                et credite le portefeuille via les tables d affiliation.
              </p>
            </div>
          </section>
        </div>
      </div>

      <section className="rounded-[30px] border border-[#e7ddd1] bg-white/95 p-5 shadow-[0_22px_50px_rgba(15,23,42,0.05)] sm:p-6">
        <div className="flex flex-col gap-3 border-b border-[#f1e8de] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#a85b3f]">Historique</p>
            <h2 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-[#171717]">Derniers credits d affiliation</h2>
            <p className="text-sm leading-7 text-[#6f665e]">Les achats livres et abonnements credites apparaissent ici avec leur source.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          {creditTimeline.length > 0 ? (
            creditTimeline.map((transaction) => {
              return (
                <article
                  key={transaction.id}
                  className="flex flex-col gap-4 rounded-[24px] border border-[#ece3d7] bg-[#fcfaf7] p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#fff1ea] px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-[#a85b3f]">
                        {transaction.badgeLabel}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-[#6f665e]">
                        {formatDate(transaction.created_at)}
                      </span>
                    </div>
                    <div>
                      <p className="text-lg font-semibold tracking-[-0.03em] text-[#171717]">
                        {transaction.referredUserLabel}
                      </p>
                      <p className="text-sm leading-6 text-[#6f665e]">{transaction.detailLabel}</p>
                    </div>
                  </div>
                  <div className="rounded-[20px] border border-[#e7ddd1] bg-white px-4 py-3 text-right">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-[#8b8177]">Commission</p>
                    <p className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[#171717]">
                      {formatMoney(transaction.commission_amount, transaction.currency_code)}
                    </p>
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState
              title="Aucun credit pour le moment"
              description="Partagez votre lien lecteur, livre ou paquet. Les achats livres et nouvelles souscriptions actives apparaitront ici automatiquement."
              action={
                <Link
                  href="/dashboard/reader/subscriptions"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-[#171717] px-4 text-sm font-semibold text-white transition hover:bg-[#0f172a]"
                >
                  Voir les paquets Premium
                </Link>
              }
            />
          )}
        </div>
      </section>
    </section>
  );
}
