"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, CreditCard, Library,
  LockKeyhole, ShieldCheck, UserPlus,
} from "lucide-react";
import { FavoriteBookButton } from "@/components/books/favorite-book-button";
import { BookReviews } from "@/components/books/book-reviews";
import { CinetPayButtons } from "@/components/payments/cinetpay-buttons";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { ReaderPopup } from "@/components/reader/reader-popup";
import { getLibraryAccessLabel } from "@/lib/access-labels";
import { getBookFormatLabel, isPhysicalBookFormat, type CheckoutBookFormat } from "@/lib/book-formats";

type SubscriptionPlan = { id: string; name: string; slug: string; monthly_price: number; currency_code: string; is_active: boolean };
type BookDetailView = {
  id: string; author_id: string; title: string; subtitle: string | null; description: string | null;
  author_name: string; author_avatar_url?: string | null; cover_signed_url: string | null; price: number;
  currency_code: string; display_price_label: string; offer_summary_label: string; categories: string[];
  language?: string | null; page_count?: number | null; is_favorite?: boolean; is_free: boolean;
  rating_avg?: number | null; ratings_count?: number | null;
  is_single_sale_enabled: boolean; is_subscription_available: boolean;
  purchase_formats: Array<{ format: CheckoutBookFormat; price: number; currency_code: string }>;
  subscription_plans: SubscriptionPlan[];
};
type AccessState = {
  hasAccess: boolean; hasPurchaseAccess: boolean; hasSubscriptionAccess: boolean; hasLibraryEntry: boolean;
  activeSubscription: { subscription_plans: { name: string } | { name: string }[] | null } | null;
  libraryEntry: { access_type: "purchase" | "subscription" | "free" } | null;
  isSubscriptionEntitlementExpired: boolean;
} | null;
type Props = {
  book: BookDetailView; accessState: AccessState; isAuthenticated: boolean; autoOpenReader?: boolean;
  checkoutCustomer: { customerId?: string | null; firstName?: string | null; lastName?: string | null; email?: string | null; phoneNumber?: string | null; city?: string | null; country?: string | null } | null;
};

function firstOf<T>(value: T | T[] | null | undefined) { return Array.isArray(value) ? value[0] ?? null : value ?? null; }
function money(amount: number, currency: string) { return amount <= 0 ? "Gratuit" : new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(amount); }

export function BookDetailClient({ book, accessState, isAuthenticated, autoOpenReader = false, checkoutCustomer }: Props) {
  const [readerOpen, setReaderOpen] = useState(autoOpenReader);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const activePlanName = firstOf(accessState?.activeSubscription?.subscription_plans)?.name ?? null;
  const accessType = accessState?.libraryEntry?.access_type;
  const canRead = book.is_free || Boolean(accessState?.hasAccess);
  const paidFormats = book.purchase_formats.filter((format) => format.price > 0);
  // Formats que l'on peut mettre au panier : tout format payant tant que le livre n'est pas lu,
  // puis seulement les éditions imprimées (un lecteur peut vouloir le papier en plus).
  const cartFormats = (canRead
    ? paidFormats.filter((format) => isPhysicalBookFormat(format.format))
    : book.is_single_sale_enabled
      ? paidFormats.length > 0
        ? paidFormats
        : book.price > 0
          ? [{ format: "ebook" as CheckoutBookFormat, price: book.price, currency_code: book.currency_code }]
          : []
      : []);
  const [cartFormat, setCartFormat] = useState<CheckoutBookFormat | null>(null);
  const selectedCartFormat = cartFormats.find((format) => format.format === cartFormat) ?? cartFormats[0] ?? null;
  const returnPath = `/book/${book.id}`;
  const loginHref = `/login?next=${encodeURIComponent(returnPath)}`;
  const registerHref = `/register?role=reader&next=${encodeURIComponent(returnPath)}`;
  const subscriptionHref = isAuthenticated ? "/dashboard/reader/subscriptions" : loginHref;
  const accessMessage = book.is_free
    ? isAuthenticated
      ? "Cette édition numérique est offerte. Vous pouvez lire le livre complet avec votre compte."
      : "Lisez les 10 premières pages immédiatement, sans compte. Créez ensuite un compte lecteur gratuit pour continuer le livre complet."
    : accessState?.hasPurchaseAccess
      ? "Ce livre vous appartient et reste accessible dans votre bibliothèque."
      : accessState?.hasSubscriptionAccess
        ? `Inclus dans votre abonnement${activePlanName ? ` ${activePlanName}` : " Premium"}.`
        : accessState?.isSubscriptionEntitlementExpired
          ? "Votre accès Premium a expiré. Réactivez votre abonnement pour continuer."
          : book.is_subscription_available
            ? "Disponible à l’unité ou avec un abonnement Holistique Plus."
            : "Achetez ce titre et retrouvez-le dans votre bibliothèque personnelle.";

  return (
    <>
      <div className="hb-fullbleed min-h-screen bg-slate-100 text-slate-900">
        <section className="relative overflow-hidden bg-night-900 text-white">
          <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-5 sm:px-6 sm:pb-12 lg:px-8">
            <Link href="/books" className="inline-flex min-h-10 items-center gap-2 text-xs font-extrabold text-white/62 transition hover:text-white"><ArrowLeft className="h-4 w-4" /> Retour à la librairie</Link>
            <div className="mt-4 grid gap-8 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-start lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12">
              <div id="book-cover" className="mx-auto w-[180px] overflow-hidden rounded-md border border-white/10 bg-slate-300 shadow-md sm:mx-0 sm:w-[200px] lg:w-[260px]">
                <div className="aspect-[0.69]">{book.cover_signed_url ? <Image src={book.cover_signed_url} alt={`Couverture de ${book.title}`} width={660} height={960} priority className="h-full w-full object-cover" /> : <div className="flex h-full flex-col justify-end gap-3 bg-night-800 p-8 text-white"><span className="h-0.5 w-10 bg-brand-600" aria-hidden="true" /><span className="text-2xl font-bold leading-snug">{book.title}</span><span className="text-sm text-night-200">{book.author_name}</span></div>}</div>
              </div>
              {/* Sur grand écran, la zone d’achat chevauche le bandeau à droite : on lui réserve la place. */}
              <div className="min-w-0 lg:pr-[420px]">
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${book.is_free ? "bg-brand-600 text-white" : "bg-white/12 text-white"}`}>{book.is_free ? "Lecture gratuite" : book.offer_summary_label}</span>
                  {accessType ? <span className="rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white">{getLibraryAccessLabel(accessType, !accessState?.isSubscriptionEntitlementExpired)}</span> : null}
                </div>
                <h1 className="mt-4 max-w-4xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-[2.6rem]">{book.title}</h1>
                {book.subtitle ? <p className="mt-4 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">{book.subtitle}</p> : null}
                <Link href={`/authors/${book.author_id}`} className="mt-6 inline-flex items-center gap-3 font-bold text-brand-300 transition hover:text-brand-300">
                  {book.author_avatar_url ? <Image src={book.author_avatar_url} alt="" width={38} height={38} className="h-9 w-9 rounded-full object-cover ring-2 ring-white/20" /> : <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-xs">HB</span>}
                  <span><span className="block text-xs text-white/45">Un livre de</span>{book.author_name}</span>
                </Link>
                <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-semibold text-white/55">
                  {book.categories.map((category) => <span key={category} className="rounded-full border border-white/15 px-3 py-1.5">{category}</span>)}
                  {book.page_count ? <span>{book.page_count} pages</span> : null}
                  {book.language ? <span>{book.language.toUpperCase()}</span> : null}
                </div>
                <div className="mt-7"><FavoriteBookButton bookId={book.id} initialIsFavorite={book.is_favorite} /></div>
              </div>
            </div>
          </div>
        </section>

        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-16">
            <div>
              <section>
                <p className="text-xs font-extrabold text-brand-600">À propos du livre</p>
                <h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.04em]">Une histoire à découvrir</h2>
                <div className="mt-6 whitespace-pre-line text-[1.05rem] leading-8 text-slate-700">{book.description?.trim() || "La présentation éditoriale de ce titre sera bientôt disponible."}</div>
              </section>

              <section className="mt-12 border-t border-slate-300 pt-10">
                <p className="text-xs font-extrabold text-brand-600">Formats disponibles</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {book.purchase_formats.map((format) => <div key={format.format} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-300 bg-white p-4"><div><p className="font-extrabold">{getBookFormatLabel(format.format)}</p><p className="mt-1 text-xs text-slate-500">Lecture web et mobile sécurisée</p></div><p className="font-extrabold text-emerald-700">{money(format.price, format.currency_code)}</p></div>)}
                  {book.subscription_plans.map((plan) => <div key={plan.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-200 p-4"><div><p className="font-extrabold">{plan.name}</p><p className="mt-1 text-xs text-slate-500">Abonnement mensuel</p></div><p className="font-extrabold text-brand-600">{money(plan.monthly_price, plan.currency_code)}</p></div>)}
                </div>
              </section>

              <BookReviews
                bookId={book.id}
                isAuthenticated={isAuthenticated}
                ratingAvg={book.rating_avg}
                ratingsCount={book.ratings_count}
              />

              <section className="mt-10 rounded-xl bg-slate-200 p-6 sm:p-8">
                <div className="flex items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-night-900 text-brand-300"><ShieldCheck className="h-5 w-5" /></span><div><h2 className="font-display text-xl font-extrabold">Une lecture pensée pour vous</h2><p className="mt-2 text-sm leading-7 text-slate-600">Lisez sur téléphone, tablette ou ordinateur. Votre bibliothèque, votre progression et vos notes restent liées à votre compte.</p></div></div>
              </section>
            </div>

            <aside className="lg:sticky lg:top-32 lg:-mt-[400px]">
              <div className="rounded-xl border border-slate-300 bg-white p-6 shadow-md">
                <p className="text-xs font-extrabold text-brand-600">Votre accès</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{book.display_price_label}</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">{accessMessage}</p>
                {book.is_free ? (
                  <div className="mt-5 space-y-2 text-sm font-semibold text-slate-700">
                    <p className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-700" />{isAuthenticated ? "Livre complet avec votre compte" : "10 pages à lire sans compte"}</p>
                    <p className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-700" />Aucun paiement</p>
                    {!isAuthenticated ? <p className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-700" />Compte gratuit seulement pour continuer après l’aperçu</p> : null}
                  </div>
                ) : null}

                {selectedCartFormat ? (
                  <div className="mt-5">
                    {cartFormats.length > 1 ? (
                      <div className="mb-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Format">
                        {cartFormats.map((format) => {
                          const active = format.format === selectedCartFormat.format;
                          return (
                            <button key={format.format} type="button" role="radio" aria-checked={active} onClick={() => setCartFormat(format.format)} className={`rounded-md border px-3 py-2 text-left text-xs transition ${active ? "border-night-900 bg-night-50 ring-1 ring-night-900" : "border-slate-300 hover:border-slate-400"}`}>
                              <span className="block font-semibold text-slate-900">{getBookFormatLabel(format.format)}</span>
                              <span className="mt-0.5 block font-bold text-slate-700">{money(format.price, format.currency_code)}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                    <AddToCartButton
                      sourceSelector="#book-cover"
                      item={{
                        bookId: book.id,
                        format: selectedCartFormat.format,
                        title: book.title,
                        authorName: book.author_name,
                        coverUrl: book.cover_signed_url,
                        unitPrice: selectedCartFormat.price,
                        currencyCode: selectedCartFormat.currency_code,
                      }}
                      label={canRead ? `Commander l’édition ${getBookFormatLabel(selectedCartFormat.format).toLowerCase()}` : "Ajouter au panier"}
                      className="min-h-12 w-full rounded-full bg-brand-600 px-6 text-sm font-extrabold text-white hover:bg-brand-700"
                    />
                  </div>
                ) : null}

                <div className="mt-3 grid gap-3">
                  {canRead ? (
                    <button type="button" onClick={() => setReaderOpen(true)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-600 px-6 text-sm font-extrabold text-white transition hover:bg-brand-700">
                      <BookOpen className="h-4 w-4" /> {book.is_free && !isAuthenticated ? "Lire 10 pages gratuitement" : "Lire maintenant"}
                    </button>
                  ) : null}
                  {!canRead && book.is_single_sale_enabled ? <button type="button" onClick={() => setPurchaseOpen((open) => !open)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-night-900 px-6 text-sm font-extrabold text-white transition hover:bg-night-800"><CreditCard className="h-4 w-4" /> {purchaseOpen ? "Fermer" : "Acheter maintenant"}<ChevronDown className={`h-4 w-4 transition ${purchaseOpen ? "rotate-180" : ""}`} /></button> : null}
                  {!canRead && book.is_subscription_available ? <Link href={subscriptionHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-night-900 bg-white px-6 text-sm font-extrabold text-night-900 transition hover:bg-night-50">Lire avec Holistique Plus <ArrowRight className="h-4 w-4" /></Link> : null}
                  {accessState?.hasLibraryEntry ? <Link href="/dashboard/reader/library" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-300 text-sm font-bold"><Library className="h-4 w-4" /> Ma bibliothèque</Link> : null}
                </div>
                {book.is_free && !isAuthenticated ? (
                  <div className="mt-5 border-t border-slate-200 pt-5">
                    <p className="text-xs font-semibold leading-5 text-slate-600">
                      Pas besoin de compte pour commencer. L’inscription n’est demandée qu’après les 10 premières pages.
                    </p>
                    <Link href={registerHref} className="mt-3 inline-flex items-center gap-2 text-xs font-extrabold text-brand-700">
                      <UserPlus className="h-4 w-4 shrink-0" />Créer mon compte lecteur
                    </Link>
                  </div>
                ) : null}
                <p className="mt-5 flex items-center gap-2 text-[0.68rem] font-semibold text-slate-500"><LockKeyhole className="h-3.5 w-3.5" /> Paiement sécurisé et accès après confirmation</p>
              </div>
            </aside>
          </div>

          {purchaseOpen && !canRead && book.is_single_sale_enabled ? (
            <section className="mt-12 scroll-mt-28 rounded-xl border border-slate-300 bg-white p-5 sm:p-8">
              <div className="mb-6"><p className="text-xs font-extrabold text-brand-600">Finaliser l’achat</p><h2 className="mt-2 font-display text-2xl font-extrabold">Vos informations de paiement</h2><p className="mt-2 text-sm text-slate-600">Choisissez votre format et le moyen de paiement qui vous convient.</p></div>
              <CinetPayButtons bookId={book.id} bookTitle={book.title} amount={book.price} currencyCode={book.currency_code} formatOptions={book.purchase_formats.map((format) => ({ format: format.format, label: getBookFormatLabel(format.format), amount: format.price, currencyCode: format.currency_code }))} isAuthenticated={isAuthenticated} loginHref={loginHref} defaultCustomer={checkoutCustomer} />
            </section>
          ) : null}

          {book.is_free && paidFormats.length > 0 ? <section className="mt-10 rounded-xl border border-slate-300 bg-white p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-extrabold text-brand-600">Éditions imprimées</p><h2 className="mt-2 font-display text-xl font-extrabold">La lecture numérique reste gratuite.</h2></div><button type="button" onClick={() => setPurchaseOpen((open) => !open)} className="min-h-11 rounded-full border border-slate-300 px-5 text-sm font-bold">{purchaseOpen ? "Fermer" : "Commander une édition"}</button></div>{purchaseOpen ? <div className="mt-6"><CinetPayButtons bookId={book.id} bookTitle={book.title} amount={paidFormats[0].price} currencyCode={paidFormats[0].currency_code} formatOptions={paidFormats.map((format) => ({ format: format.format, label: getBookFormatLabel(format.format), amount: format.price, currencyCode: format.currency_code }))} isAuthenticated={isAuthenticated} loginHref={loginHref} defaultCustomer={checkoutCustomer} /></div> : null}</section> : null}
        </main>
      </div>
      <ReaderPopup bookId={book.id} open={readerOpen} onClose={() => setReaderOpen(false)} />
    </>
  );
}
