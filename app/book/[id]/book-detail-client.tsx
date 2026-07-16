"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Check, Library, LockKeyhole, Sparkles, UserPlus } from "lucide-react";
import { useState } from "react";
import { FavoriteBookButton } from "@/components/books/favorite-book-button";
import { CinetPayButtons } from "@/components/payments/cinetpay-buttons";
import { ReaderPopup } from "@/components/reader/reader-popup";
import { getLibraryAccessLabel } from "@/lib/access-labels";
import { getBookFormatLabel, type CheckoutBookFormat } from "@/lib/book-formats";

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
  author_id: string;
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
  language?: string | null;
  page_count?: number | null;
  is_favorite?: boolean;
  is_free: boolean;
  is_single_sale_enabled: boolean;
  is_subscription_available: boolean;
  purchase_formats: Array<{
    format: CheckoutBookFormat;
    price: number;
    currency_code: string;
  }>;
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
  autoOpenReader?: boolean;
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

export function BookDetailClient({
  book,
  accessState,
  isAuthenticated,
  autoOpenReader = false,
  checkoutCustomer,
}: BookDetailClientProps) {
  const [readerOpen, setReaderOpen] = useState(autoOpenReader);
  const [purchaseOpen, setPurchaseOpen] = useState(false);

  const activePlanName = firstOf(accessState?.activeSubscription?.subscription_plans)?.name ?? null;
  const libraryAccessType = accessState?.libraryEntry?.access_type ?? null;
  const inLibraryLabel = libraryAccessType
    ? getLibraryAccessLabel(libraryAccessType, !accessState?.isSubscriptionEntitlementExpired)
    : null;
  const canRead = book.is_free || Boolean(accessState?.hasAccess);
  const isGuestFreeReader = book.is_free && !isAuthenticated;
  const paidFormats = book.purchase_formats.filter((format) => format.price > 0);
  const returnPath = `/book/${book.id}`;
  const loginHref = `/login?next=${encodeURIComponent(returnPath)}`;
  const registerHref = `/register?role=reader&next=${encodeURIComponent(returnPath)}`;
  const subscriptionHref = isAuthenticated ? "/dashboard/reader/subscriptions" : loginHref;

  const accessMessage = book.is_free
    ? "Lecture intégrale offerte par l’auteur et Holistique Books. Aucun compte n’est nécessaire."
    : accessState?.hasPurchaseAccess
      ? "Ce livre vous appartient et reste disponible dans votre bibliothèque."
      : accessState?.hasSubscriptionAccess
        ? activePlanName
          ? `Votre abonnement ${activePlanName} vous donne accès à ce livre.`
          : "Votre abonnement Premium vous donne accès à ce livre."
        : accessState?.isSubscriptionEntitlementExpired
          ? "Votre accès Premium a expiré. Réactivez-le pour reprendre la lecture."
          : book.is_subscription_available
            ? "Disponible avec Holistique Plus ou à l’unité selon le format."
            : book.is_single_sale_enabled
              ? "Disponible à l’achat, puis conservé dans votre bibliothèque."
              : "Ce titre n’est pas accessible pour le moment.";

  return (
    <>
      <section className="min-h-screen bg-[#f8f5f0] px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
          <Link
            href="/books"
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-2 text-sm font-semibold text-[#6f665e] transition hover:text-[#ff7a5c]"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Retour aux livres
          </Link>

          <article className="overflow-hidden rounded-[1.75rem] border border-[#eadfd4] bg-[#fffdf9] shadow-[0_18px_50px_rgba(23,23,23,0.06)] sm:rounded-[2.5rem]">
            <div className="grid grid-cols-[116px_minmax(0,1fr)] gap-4 p-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-6 sm:p-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-10 lg:p-10">
              <div className="self-start overflow-hidden rounded-[1.15rem] bg-[#eee5da] shadow-[0_16px_35px_rgba(23,23,23,0.14)] sm:rounded-[1.75rem]">
                <div className="aspect-[0.72]">
                  {book.cover_signed_url ? (
                    // Signed storage URLs are short lived and may not be cacheable by the image optimizer.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={book.cover_signed_url} alt={book.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center px-3 text-center text-sm font-bold text-[#8a8178] sm:px-6 sm:text-lg">
                      {book.title}
                    </div>
                  )}
                </div>
              </div>

              <div className="min-w-0 self-center">
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  <span className={book.is_free ? "rounded-full bg-[#e8f7ef] px-2.5 py-1 text-[0.65rem] font-bold text-[#18794e] sm:px-3 sm:text-xs" : "rounded-full bg-[#fff0ec] px-2.5 py-1 text-[0.65rem] font-bold text-[#a85b3f] sm:px-3 sm:text-xs"}>
                    {book.is_free ? "Gratuit · sans compte" : book.offer_summary_label}
                  </span>
                  {inLibraryLabel ? (
                    <span className="rounded-full bg-[#f1edff] px-2.5 py-1 text-[0.65rem] font-bold text-[#6551b9] sm:px-3 sm:text-xs">
                      {inLibraryLabel}
                    </span>
                  ) : null}
                </div>

                <Link href={`/authors/${book.author_id}`} className="mt-3 block text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#a85b3f] hover:underline sm:text-xs">
                  {book.author_name}
                </Link>
                <h1 className="mt-1.5 text-[1.45rem] font-bold leading-[1.08] tracking-[-0.04em] text-[#171717] sm:text-3xl lg:text-5xl">
                  {book.title}
                </h1>
                {book.subtitle ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#6f665e] sm:text-base sm:leading-7">{book.subtitle}</p> : null}

                <div className="mt-3 flex flex-wrap items-center gap-2 text-[0.68rem] font-semibold text-[#7d7267] sm:mt-5 sm:text-sm">
                  {book.categories[0] ? <span>{book.categories[0]}</span> : null}
                  {book.page_count ? <span>• {book.page_count} pages</span> : null}
                  {book.language ? <span className="hidden sm:inline">• {book.language.toUpperCase()}</span> : null}
                </div>

                <div className="mt-3 sm:mt-5">
                  <FavoriteBookButton bookId={book.id} initialIsFavorite={book.is_favorite} />
                </div>
              </div>
            </div>

            <div className="border-t border-[#efe6dc] px-4 py-5 sm:px-6 lg:px-10">
              <p className="max-w-4xl text-sm leading-7 text-[#5f574f] sm:text-[0.96rem]">
                {book.description?.trim() || "La présentation éditoriale de ce titre sera bientôt disponible."}
              </p>
            </div>
          </article>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)] lg:gap-6">
            <section className={book.is_free ? "overflow-hidden rounded-[1.75rem] bg-[#171717] p-5 text-white shadow-[0_22px_55px_rgba(23,23,23,0.18)] sm:rounded-[2rem] sm:p-8" : "rounded-[1.75rem] border border-[#eadfd4] bg-white p-5 shadow-sm sm:rounded-[2rem] sm:p-8"}>
              <div className="flex items-start gap-3">
                <span className={book.is_free ? "grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#ff7a5c] text-white" : "grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#fff0ec] text-[#c85439]"}>
                  {book.is_free ? <Sparkles aria-hidden="true" className="h-5 w-5" /> : <LockKeyhole aria-hidden="true" className="h-5 w-5" />}
                </span>
                <div>
                  <p className={book.is_free ? "text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#ffc0b2]" : "text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#a85b3f]"}>
                    Accès à la lecture
                  </p>
                  <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] sm:text-2xl">
                    {book.is_free ? "Ouvrez le livre, sans formulaire." : book.display_price_label}
                  </h2>
                </div>
              </div>

              <p className={book.is_free ? "mt-4 text-sm leading-7 text-white/72" : "mt-4 text-sm leading-7 text-[#6f665e]"}>{accessMessage}</p>

              {book.is_free ? (
                <div className="mt-4 grid gap-2 text-sm text-white/78 sm:grid-cols-2">
                  <p className="flex items-center gap-2"><Check aria-hidden="true" className="h-4 w-4 text-[#ff9b84]" /> Lecture complète immédiate</p>
                  <p className="flex items-center gap-2"><Check aria-hidden="true" className="h-4 w-4 text-[#ff9b84]" /> Aucun compte obligatoire</p>
                </div>
              ) : null}

              {canRead ? (
                <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
                  <button
                    type="button"
                    onClick={() => setReaderOpen(true)}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#ff7a5c] px-6 text-sm font-bold text-white shadow-[0_16px_35px_rgba(255,122,92,0.25)] transition hover:-translate-y-0.5 hover:bg-[#ef6b4f] sm:w-auto"
                  >
                    <BookOpen aria-hidden="true" className="h-4 w-4" />
                    {book.is_free ? "Lire gratuitement" : "Lire maintenant"}
                  </button>

                  {accessState?.hasLibraryEntry ? (
                    <Link href="/dashboard/reader/library" className={book.is_free ? "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 px-5 text-sm font-semibold text-white" : "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#eadfd4] px-5 text-sm font-semibold text-[#403a34]"}>
                      <Library aria-hidden="true" className="h-4 w-4" /> Ma bibliothèque
                    </Link>
                  ) : null}
                </div>
              ) : book.is_single_sale_enabled ? (
                <div className="mt-6 space-y-3">
                  <CinetPayButtons
                    bookId={book.id}
                    bookTitle={book.title}
                    amount={book.price}
                    currencyCode={book.currency_code}
                    formatOptions={book.purchase_formats.map((format) => ({
                      format: format.format,
                      label: getBookFormatLabel(format.format),
                      amount: format.price,
                      currencyCode: format.currency_code,
                    }))}
                    isAuthenticated={isAuthenticated}
                    loginHref={loginHref}
                    defaultCustomer={checkoutCustomer}
                  />
                </div>
              ) : book.is_subscription_available ? (
                <Link href={subscriptionHref} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#171717] px-6 text-sm font-bold text-white sm:w-auto">
                  Découvrir Holistique Plus <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              ) : null}

              {isGuestFreeReader ? (
                <div className="mt-5 border-t border-white/10 pt-5">
                  <Link href={registerHref} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#ffc0b2] hover:text-white">
                    <UserPlus aria-hidden="true" className="h-4 w-4" />
                    Créer un compte seulement pour sauvegarder vos notes
                  </Link>
                </div>
              ) : null}
            </section>

            <aside className="rounded-[1.75rem] border border-[#eadfd4] bg-[#fffdf9] p-5 sm:rounded-[2rem] sm:p-6">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#a85b3f]">Formats et offres</p>
              <div className="mt-4 space-y-3">
                {book.purchase_formats.length > 0 ? (
                  book.purchase_formats.map((format) => (
                    <div key={format.format} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-[#efe6dc]">
                      <div>
                        <p className="text-sm font-bold text-[#171717]">{getBookFormatLabel(format.format)}</p>
                        <p className="mt-1 text-xs text-[#8a8178]">Lecture sécurisée web et mobile</p>
                      </div>
                      <span className="shrink-0 text-sm font-bold text-[#171717]">
                        {format.price <= 0 ? "Gratuit" : new Intl.NumberFormat("fr-FR", { style: "currency", currency: format.currency_code }).format(format.price)}
                      </span>
                    </div>
                  ))
                ) : null}

                {book.subscription_plans.map((plan) => (
                  <div key={plan.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[#fff0ec] p-4">
                    <div>
                      <p className="text-sm font-bold text-[#171717]">{plan.name}</p>
                      <p className="mt-1 text-xs text-[#8a8178]">Accès tant que l’abonnement est actif</p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-[#a85b3f]">
                      {new Intl.NumberFormat("fr-FR", { style: "currency", currency: plan.currency_code }).format(plan.monthly_price)}
                    </span>
                  </div>
                ))}

                {book.purchase_formats.length === 0 && book.subscription_plans.length === 0 ? (
                  <p className="rounded-2xl bg-[#f8f5f0] p-4 text-sm leading-6 text-[#6f665e]">Les formats de ce titre sont en cours de préparation.</p>
                ) : null}
              </div>
            </aside>
          </div>

          {book.is_free && paidFormats.length > 0 ? (
            <section className="rounded-[1.75rem] border border-[#eadfd4] bg-white p-5 sm:rounded-[2rem] sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#a85b3f]">Éditions payantes</p>
                  <h2 className="mt-1 text-lg font-bold text-[#171717]">La lecture numérique reste gratuite.</h2>
                  <p className="mt-1 text-sm leading-6 text-[#6f665e]">Vous pouvez aussi commander séparément une édition imprimée lorsqu’elle est proposée.</p>
                </div>
                {isAuthenticated ? (
                  <button type="button" onClick={() => setPurchaseOpen((value) => !value)} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#eadfd4] px-5 text-sm font-bold text-[#403a34]">
                    {purchaseOpen ? "Fermer l’achat" : "Voir les éditions"}
                  </button>
                ) : (
                  <Link href={loginHref} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#eadfd4] px-5 text-sm font-bold text-[#403a34]">
                    Se connecter pour commander
                  </Link>
                )}
              </div>

              {purchaseOpen && isAuthenticated ? (
                <div className="mt-5">
                  <CinetPayButtons
                    bookId={book.id}
                    bookTitle={book.title}
                    amount={paidFormats[0].price}
                    currencyCode={paidFormats[0].currency_code}
                    formatOptions={paidFormats.map((format) => ({
                      format: format.format,
                      label: getBookFormatLabel(format.format),
                      amount: format.price,
                      currencyCode: format.currency_code,
                    }))}
                    isAuthenticated
                    loginHref={loginHref}
                    defaultCustomer={checkoutCustomer}
                  />
                </div>
              ) : null}
            </section>
          ) : null}

          <section className="rounded-[1.75rem] border border-[#eadfd4] bg-white p-5 sm:rounded-[2rem] sm:p-8">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#a85b3f]">Expérience Holistique</p>
            <h2 className="mt-2 text-xl font-bold tracking-[-0.03em] text-[#171717] sm:text-2xl">Une lecture concentrée, pensée pour le téléphone.</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#6f665e]">
              Le lecteur s’ouvre en plein écran, adapte les PDF et EPUB au mobile et protège les fichiers contre le téléchargement direct. Un compte reste facultatif pour les livres gratuits ; il sert uniquement à retrouver une bibliothèque, une progression et des notes personnelles.
            </p>
          </section>
        </div>
      </section>

      <ReaderPopup bookId={book.id} open={readerOpen} onClose={() => setReaderOpen(false)} />
    </>
  );
}
