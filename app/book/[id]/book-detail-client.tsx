"use client";

import Link from "next/link";
import { useState } from "react";
import { CinetPayButtons } from "@/components/payments/cinetpay-buttons";
import { ReaderPopup } from "@/components/reader/reader-popup";
import { getLibraryAccessLabel } from "@/lib/access-labels";

type SubscriptionPlan = {
  id: string;
  name: string;
  slug: string;
  monthly_price: number;
  currency_code: string;
  is_active: boolean;
};

type BookDetailView = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  author_name: string;
  cover_signed_url: string | null;
  price: number;
  currency_code: string;
  display_price_label: string;
  offer_summary_label: string;
  categories: string[];
  is_single_sale_enabled: boolean;
  is_subscription_available: boolean;
  subscription_plans: SubscriptionPlan[];
};

type AccessState = {
  hasAccess: boolean;
  hasPurchaseAccess: boolean;
  hasSubscriptionAccess: boolean;
  hasLibraryEntry: boolean;
  activeSubscription: {
    subscription_plans: { name: string } | { name: string }[] | null;
  } | null;
  libraryEntry: {
    access_type: "purchase" | "subscription" | "free";
  } | null;
  isSubscriptionEntitlementExpired: boolean;
} | null;

type BookDetailClientProps = {
  book: BookDetailView;
  accessState: AccessState;
  isAuthenticated: boolean;
  checkoutCustomer: {
    customerId?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
    city?: string | null;
    country?: string | null;
  } | null;
};

function firstOf<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function BookDetailClient({ book, accessState, isAuthenticated, checkoutCustomer }: BookDetailClientProps) {
  const [readerOpen, setReaderOpen] = useState(false);

  const activePlanName = firstOf(accessState?.activeSubscription?.subscription_plans)?.name ?? null;
  const availablePlanNames = book.subscription_plans.map((plan) => plan.name);
  const libraryAccessType = accessState?.libraryEntry?.access_type ?? null;
  const inLibraryLabel = libraryAccessType ? getLibraryAccessLabel(libraryAccessType, !accessState?.isSubscriptionEntitlementExpired) : null;
  const loginHref = `/login?next=${encodeURIComponent(`/book/${book.id}`)}`;
  const subscriptionHref = isAuthenticated ? "/dashboard/reader/subscriptions" : loginHref;

  const primaryAction = accessState?.hasAccess
    ? { kind: "read" as const, label: "Lire maintenant" }
    : !book.is_single_sale_enabled && book.is_subscription_available
      ? { kind: "link" as const, href: subscriptionHref, label: "S abonner pour acceder" }
      : null;

  const secondaryAction =
    accessState?.hasAccess && accessState.hasLibraryEntry
      ? { href: "/dashboard/reader/library", label: "Deja dans votre bibliotheque" }
      : !accessState?.hasAccess && book.is_single_sale_enabled && book.is_subscription_available
        ? { href: subscriptionHref, label: "Inclus dans Premium" }
        : accessState?.isSubscriptionEntitlementExpired
          ? { href: subscriptionHref, label: "Reprendre Premium" }
          : null;

  const accessMessage = accessState?.hasPurchaseAccess
    ? "Vous avez deja achete ce livre."
    : accessState?.hasSubscriptionAccess
      ? activePlanName
        ? `Votre abonnement ${activePlanName} vous donne deja acces a ce livre.`
        : "Votre abonnement Premium vous donne deja acces a ce livre."
      : accessState?.isSubscriptionEntitlementExpired
        ? "Ce livre est dans votre bibliotheque via un abonnement expire. Reactivez Premium pour le relire."
        : book.is_subscription_available && availablePlanNames.length > 0
          ? `Inclus dans ${availablePlanNames.join(", ")}.`
          : book.is_single_sale_enabled
            ? "Disponible en vente individuelle."
            : "Configuration d acces en cours.";

  return (
    <>
      <section className="space-y-8 px-0 py-4">
        <div className="page-hero-shell">
          <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <div className="overflow-hidden rounded-[2rem] border border-violet-200/70 bg-white/90 shadow-[0_22px_48px_rgba(79,57,180,0.12)]">
              <div className="aspect-[3/4] bg-[linear-gradient(180deg,_#f4efff,_#efe8ff)]">
                {book.cover_signed_url ? (
                  <img src={book.cover_signed_url} alt={book.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center px-6 text-center text-lg font-semibold text-slate-500">{book.title}</div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <span className="catalog-badge">{book.offer_summary_label}</span>
                {book.categories[0] ? <span className="catalog-badge">{book.categories[0]}</span> : null}
                {inLibraryLabel ? <span className="catalog-badge">{inLibraryLabel}</span> : null}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-500">{book.author_name}</p>
                <div>
                  <h1 className="section-title text-4xl sm:text-5xl">{book.title}</h1>
                  {book.subtitle ? <p className="mt-3 text-lg leading-8 text-slate-500">{book.subtitle}</p> : null}
                </div>
                <p className="max-w-3xl text-base leading-8 text-slate-600">{book.description ?? "Description indisponible."}</p>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="surface-panel p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-500">Acces & tarification</p>
                  <p className="mt-3 text-4xl font-semibold text-slate-950">{book.display_price_label}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-500">{accessMessage}</p>

                  {accessState?.hasAccess || !book.is_single_sale_enabled ? (
                    <div className="mt-6 flex flex-wrap gap-3">
                      {primaryAction?.kind === "read" ? (
                        <button onClick={() => setReaderOpen(true)} className="cta-primary px-6 py-3 text-sm">
                          {primaryAction.label}
                        </button>
                      ) : primaryAction?.kind === "link" ? (
                        <Link href={primaryAction.href} className="cta-primary px-6 py-3 text-sm">
                          {primaryAction.label}
                        </Link>
                      ) : null}

                      {secondaryAction ? (
                        <Link href={secondaryAction.href} className="cta-secondary px-6 py-3 text-sm">
                          {secondaryAction.label}
                        </Link>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-6 space-y-3">
                      {secondaryAction ? (
                        <Link href={secondaryAction.href} className="cta-secondary inline-flex px-6 py-3 text-sm">
                          {secondaryAction.label}
                        </Link>
                      ) : null}
                      <CinetPayButtons
                        bookId={book.id}
                        bookTitle={book.title}
                        amount={book.price}
                        currencyCode={book.currency_code}
                        isAuthenticated={isAuthenticated}
                        loginHref={loginHref}
                        defaultCustomer={checkoutCustomer}
                      />
                    </div>
                  )}

                  {!isAuthenticated ? (
                    <p className="mt-4 text-sm text-slate-500">Connexion requise pour ouvrir la lecture web securisee.</p>
                  ) : (
                    <p className="mt-4 text-sm text-slate-500">Lecture disponible uniquement sur le site Holistique Books et dans notre application.</p>
                  )}
                </div>

                <div className="surface-panel-soft p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-500">Packs Premium</p>
                  {book.subscription_plans.length > 0 ? (
                    <div className="mt-4 grid gap-3">
                      {book.subscription_plans.map((plan) => (
                        <div key={plan.id} className="rounded-[1.4rem] bg-white/85 p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-950">{plan.name}</p>
                              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{plan.slug}</p>
                            </div>
                            <span className="catalog-badge">
                              {new Intl.NumberFormat("fr-FR", {
                                style: "currency",
                                currency: plan.currency_code,
                              }).format(plan.monthly_price)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm leading-6 text-slate-500">
                      Aucun pack Premium n est rattache a ce livre pour le moment.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="surface-panel p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-500">Editorial notes</p>
            <h2 className="mt-3 section-title text-2xl">Pourquoi ce livre merite votre attention</h2>
            <p className="mt-3 text-sm leading-8 text-slate-600">
              Cette page conserve toute la logique d acces actuelle tout en clarifiant les cas d usage: achat individuel, lecture via abonnement Premium, acces deja debloque ou bibliotheque existante.
            </p>
          </div>

          <div className="surface-panel-soft p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-500">Statut lecteur</p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-[1.35rem] bg-white/90 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Acces</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{accessState?.hasAccess ? "Debloque" : "Non debloque"}</p>
              </div>
              <div className="rounded-[1.35rem] bg-white/90 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Bibliotheque</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{inLibraryLabel ?? "Pas encore ajoute"}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ReaderPopup bookId={book.id} open={readerOpen} onClose={() => setReaderOpen(false)} />
    </>
  );
}
