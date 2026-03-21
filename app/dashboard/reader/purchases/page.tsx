import Link from "next/link";
import { ArrowRight, CreditCard, Gem, Receipt, ShoppingBag, Wallet } from "lucide-react";
import { DashboardTopbar } from "@/components/ui/dashboard-topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { getLibraryAccessLabel } from "@/lib/access-labels";
import { requireRole } from "@/lib/auth";
import { isSubscriptionCurrentlyActive } from "@/lib/book-access";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type MaybeArray<T> = T | T[] | null;

type OrderWithItems = {
  id: string;
  total_price: number;
  payment_status: string;
  created_at: string;
  currency_code: string;
  order_items:
    | { price: number; books: { id: string; title: string; cover_url: string | null; categories: string[] } | { id: string; title: string; cover_url: string | null; categories: string[] }[] | null }[]
    | null;
};

type LibraryEntry = {
  book_id: string;
  purchased_at: string;
  access_type: Database["public"]["Tables"]["library"]["Row"]["access_type"];
  books:
    | { id: string; title: string; price: number; cover_url: string | null; categories: string[] }
    | { id: string; title: string; price: number; cover_url: string | null; categories: string[] }[]
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

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

export default async function ReaderPurchasesPage() {
  await requireRole(["reader"]);
  const supabase = await createClient();

  const [{ data: orders }, { data: library }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, total_price, payment_status, created_at, currency_code, order_items(price, books:book_id(id, title, cover_url, categories))")
      .order("created_at", { ascending: false })
      .returns<OrderWithItems[]>(),
    supabase
      .from("library")
      .select("book_id, purchased_at, access_type, books:book_id(id, title, price, cover_url, categories), user_subscriptions:subscription_id(status, expires_at, subscription_plans!user_subscriptions_plan_id_fkey(name))")
      .order("purchased_at", { ascending: false })
      .returns<LibraryEntry[]>(),
  ]);

  const orderRows = (orders ?? []) as OrderWithItems[];
  const libraryRows = (library ?? []) as LibraryEntry[];
  const paidOrders = orderRows.filter((order) => order.payment_status === "paid");
  const totalSpent = paidOrders.reduce((sum, order) => sum + order.total_price, 0);
  const freeClaims = libraryRows.filter((item) => item.access_type === "free");
  const subscriptionClaims = libraryRows.filter((item) => item.access_type === "subscription");

  const timeline = [
    ...paidOrders.map((order) => ({
      kind: "paid" as const,
      id: order.id,
      date: order.created_at,
      label: `Commande ${order.id.slice(0, 8)}`,
      amount: order.total_price,
      status: order.payment_status,
      detail: "Achat individuel",
      titles:
        order.order_items?.map((item) => {
          const book = Array.isArray(item.books) ? item.books[0] : item.books;
          return book?.title ?? "Livre";
        }) ?? [],
    })),
    ...freeClaims.map((item) => {
      const book = Array.isArray(item.books) ? item.books[0] : item.books;
      return {
        kind: "free" as const,
        id: item.book_id,
        date: item.purchased_at,
        label: book?.title ?? "Livre gratuit",
        amount: 0,
        status: "free",
        detail: "Acces gratuit",
        titles: [book?.title ?? "Livre gratuit"],
      };
    }),
    ...subscriptionClaims.map((item) => {
      const book = Array.isArray(item.books) ? item.books[0] : item.books;
      const subscription = firstOf(item.user_subscriptions);
      const planName = firstOf(subscription?.subscription_plans)?.name ?? "Premium";
      return {
        kind: "subscription" as const,
        id: item.book_id,
        date: item.purchased_at,
        label: book?.title ?? "Livre Premium",
        amount: 0,
        status: subscription?.status ?? "subscription",
        detail: planName,
        titles: [book?.title ?? "Livre Premium"],
      };
    }),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <section className="space-y-6">
      <DashboardTopbar
        kicker="Acquisition feed"
        title="Toutes vos acquisitions au meme endroit"
        description="Les achats payants, les livres gratuits et les acces Premium remontent ici dans une timeline unique."
        actions={
          <>
            <Link href="/dashboard/reader/library" className="cta-primary px-5 py-3 text-sm">
              <ShoppingBag className="h-4 w-4" />
              Ouvrir ma bibliotheque
            </Link>
            <Link href="/dashboard/reader/subscriptions" className="cta-secondary px-5 py-3 text-sm">
              <ArrowRight className="h-4 w-4" />
              Voir Premium
            </Link>
          </>
        }
      />

      <div className="metric-grid">
        <StatCard icon={Receipt} label="Historique" value={timeline.length} description="Evenements d acquisition" tone="violet" />
        <StatCard icon={CreditCard} label="Payees" value={paidOrders.length} description="Commandes confirmees" tone="emerald" />
        <StatCard icon={Wallet} label="Budget" value={formatCurrency(totalSpent)} description="Montant depense" tone="amber" />
        <StatCard icon={Gem} label="Premium" value={subscriptionClaims.length} description="Titres ouverts via abonnement" tone="sky" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="surface-panel p-6">
          <div className="section-header">
            <div className="space-y-2">
              <p className="section-kicker">Timeline</p>
              <h2 className="section-title text-2xl">Historique des acquisitions</h2>
              <p className="section-description">Achats, titres gratuits et lectures Premium affiches dans le meme flux.</p>
            </div>
            <span className="catalog-badge">{timeline.length} evenements</span>
          </div>

          <div className="mt-5 space-y-3">
            {timeline.length > 0 ? (
              timeline.map((entry) => (
                <article
                  key={`${entry.kind}-${entry.id}`}
                  className="rounded-[1.6rem] border border-violet-100 bg-[linear-gradient(135deg,_rgba(255,255,255,0.95),_rgba(244,239,255,0.92))] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-slate-950">{entry.label}</p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            entry.kind === "subscription"
                              ? "bg-indigo-100 text-indigo-700"
                              : entry.kind === "free"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-sky-100 text-sky-700"
                          }`}
                        >
                          {entry.kind === "subscription" ? "Premium" : entry.kind === "free" ? "Gratuit" : "Payant"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">{new Date(entry.date).toLocaleDateString("fr-FR")}</p>
                      <p className="mt-2 text-sm text-slate-600">{entry.detail}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {entry.titles.map((title) => (
                          <span key={`${entry.id}-${title}`} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-violet-100">
                            {title}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-950">{formatCurrency(entry.amount)}</p>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{entry.status}</p>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState title="Aucune acquisition" description="Votre historique apparaitra ici au fil des achats, titres gratuits et lectures Premium." />
            )}
          </div>
        </section>

        <div className="grid gap-5">
          <section className="surface-panel p-5">
            <p className="section-kicker">Premium focus</p>
            <div className="mt-4 grid gap-3">
              {subscriptionClaims.length > 0 ? (
                subscriptionClaims.slice(0, 4).map((item) => {
                  const book = Array.isArray(item.books) ? item.books[0] : item.books;
                  const subscription = firstOf(item.user_subscriptions);
                  const planName = firstOf(subscription?.subscription_plans)?.name ?? "Premium";
                  const isActive = isSubscriptionCurrentlyActive(subscription ?? null);

                  return (
                    <article key={item.book_id} className="rounded-[1.35rem] bg-violet-50/80 p-4">
                      <p className="font-semibold text-slate-950">{book?.title ?? "Livre Premium"}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {planName} · {getLibraryAccessLabel("subscription", isActive)}
                      </p>
                    </article>
                  );
                })
              ) : (
                <EmptyState title="Aucun titre Premium" description="Vos lectures via abonnement s afficheront ici." />
              )}
            </div>
          </section>

          <section className="surface-panel-soft p-5">
            <p className="section-kicker">Budget lecture</p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950">{formatCurrency(totalSpent)}</h2>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              L historique tient maintenant compte des lectures via abonnement, en plus des achats et des titres gratuits.
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}
