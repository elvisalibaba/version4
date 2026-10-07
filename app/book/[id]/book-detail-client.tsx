"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight, BookOpen, Check, ChevronDown, CreditCard, Library,
  LockKeyhole, ShieldCheck, Star, UserPlus,
} from "lucide-react";
import { ShareButton } from "@/components/books/share-button";
import { Breadcrumbs } from "@/components/ui/page-header";
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
  has_sample?: boolean; isbn?: string | null; publisher?: string | null; publication_date?: string | null;
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

const LANGUAGES: Record<string, string> = { fr: "Français", en: "Anglais", ln: "Lingala", sw: "Swahili", kg: "Kikongo", lu: "Tshiluba" };

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
          ? "Votre accès Premium à expiré. Réactivez votre abonnement pour continuer."
          : book.is_subscription_available
            ? "Disponible à l’unité ou avec un abonnement Holistique Plus."
            : "Achetez ce titre et retrouvez-le dans votre bibliothèque personnelle.";

  const primaryCategory = book.categories[0] ?? null;
  const canPreview = !canRead && Boolean(book.has_sample);
  const facts = [
    { label: "Auteur", value: book.author_name },
    { label: "Éditeur", value: book.publisher || "Holistique Books" },
    { label: "Parution", value: book.publication_date ? new Date(book.publication_date).toLocaleDateString("fr-FR", { year: "numeric", month: "long" }) : null },
    { label: "Pages", value: book.page_count ? String(book.page_count) : null },
    { label: "Langue", value: book.language ? (LANGUAGES[book.language] ?? book.language.toUpperCase()) : null },
    { label: "ISBN", value: book.isbn },
    { label: "Rayon", value: book.categories.join(", ") || null },
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact.value));

  return (
    <>
      <div className="hb-fullbleed bg-paper text-slate-900">
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: "Catalogue", href: "/books" }, ...(primaryCategory ? [{ label: primaryCategory, href: `/books?category=${encodeURIComponent(primaryCategory)}` }] : []), { label: book.title }]} />

          <div className="mt-8 grid gap-x-12 gap-y-8 [grid-template-areas:'cover''head''buy''body'] lg:grid-cols-[17rem_minmax(0,1fr)_21rem] lg:[grid-template-areas:'cover_head_buy''cover_body_buy']">
            {/* Couverture */}
            <div className="[grid-area:cover]">
              <div className="lg:sticky lg:top-40">
                <div id="book-cover" className="hb-book relative mx-auto aspect-2/3 w-[11.5rem] bg-night-900 sm:w-[13rem] lg:w-full">
                  {book.cover_signed_url ? (
                    <Image src={book.cover_signed_url} alt={`Couverture de ${book.title}`} fill sizes="(max-width: 1024px) 13rem, 17rem" priority className="object-cover" />
                  ) : (
                    <div className="flex h-full flex-col px-6 pb-6 text-white">
                      <span className="ml-auto h-10 w-5 bg-brand-600 [clip-path:polygon(0_0,100%_0,100%_100%,50%_78%,0_100%)]" aria-hidden="true" />
                      <span className="mt-auto font-display text-2xl font-semibold leading-tight">{book.title}</span>
                      <span className="mt-3 h-px w-10 bg-night-400" aria-hidden="true" />
                      <span className="mt-3 font-display text-sm italic text-night-200">{book.author_name}</span>
                    </div>
                  )}
                </div>
                <div className="mx-auto mt-5 flex w-[11.5rem] items-center justify-center gap-2 sm:w-[13rem] lg:w-full">
                  <FavoriteBookButton bookId={book.id} initialIsFavorite={book.is_favorite} />
                  <ShareButton title={book.title} />
                </div>
                {canPreview ? (
                  <button type="button" onClick={() => setReaderOpen(true)} className="hb-link mx-auto mt-4 flex items-center gap-2 text-sm font-semibold text-night-900">
                    <BookOpen aria-hidden="true" className="h-4 w-4" /> Lire un extrait gratuit
                  </button>
                ) : null}
              </div>
            </div>

            {/* Titre */}
            <header className="[grid-area:head]">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-wider ${book.is_free ? "bg-brand-600 text-white" : "border border-rule-strong text-night-800"}`}>{book.is_free ? "Lecture gratuite" : book.offer_summary_label}</span>
                {accessType ? <span className="bg-night-900 px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-wider text-white">{getLibraryAccessLabel(accessType, !accessState?.isSubscriptionEntitlementExpired)}</span> : null}
              </div>
              <h1 className="mt-4 font-display text-[2.2rem] font-semibold leading-[1.1] tracking-tight text-night-900 sm:text-[2.7rem]">{book.title}</h1>
              {book.subtitle ? <p className="mt-3 font-display text-xl italic leading-snug text-slate-600">{book.subtitle}</p> : null}
              <Link href={`/authors/${book.author_id}`} className="group mt-5 inline-flex items-center gap-3">
                {book.author_avatar_url ? <Image src={book.author_avatar_url} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover ring-1 ring-rule-strong" /> : <span className="grid h-10 w-10 place-items-center rounded-full bg-night-900 font-display text-sm text-white">{book.author_name.slice(0, 1)}</span>}
                <span className="text-[0.95rem] text-slate-600">par <span className="font-semibold text-night-900 group-hover:text-brand-700 group-hover:underline">{book.author_name}</span></span>
              </Link>
              {book.rating_avg ? (
                <p className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                  <span className="flex" aria-hidden="true">{[1, 2, 3, 4, 5].map((star) => <Star key={star} className={`h-4 w-4 ${star <= Math.round(book.rating_avg ?? 0) ? "fill-amber-400 text-amber-400" : "fill-rule text-rule"}`} />)}</span>
                  <span>{book.rating_avg.toFixed(1)} · {book.ratings_count ?? 0} avis</span>
                </p>
              ) : null}
            </header>

            {/* Présentation et fiche technique */}
            <div className="[grid-area:body]">
              <section className="border-t border-rule pt-8">
                <h2 className="font-display text-2xl font-semibold text-night-900">Présentation</h2>
                <div className="mt-4 whitespace-pre-line text-[1.05rem] leading-8 text-slate-700">{book.description?.trim() || "La présentation éditoriale de ce titre sera bientôt disponible."}</div>
              </section>

              {facts.length > 0 ? (
                <section className="mt-10 border-t border-rule pt-8">
                  <h2 className="font-display text-2xl font-semibold text-night-900">Fiche technique</h2>
                  <dl className="mt-4 divide-y divide-rule border-y border-rule text-[0.95rem]">
                    {facts.map((fact) => (
                      <div key={fact.label} className="grid grid-cols-[8rem_1fr] gap-4 py-2.5">
                        <dt className="text-slate-500">{fact.label}</dt>
                        <dd className="font-medium text-night-900">{fact.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ) : null}
            </div>

            {/* Accès et achat */}
            <aside className="[grid-area:buy]">
              <div className="border border-rule-strong bg-white p-6 lg:sticky lg:top-40">
                <p className="font-display text-[2rem] font-semibold leading-none tabular-nums text-night-900">{book.display_price_label}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{accessMessage}</p>
                {book.is_free ? (
                  <ul className="mt-4 space-y-1.5 text-sm text-slate-700">
                    <li className="flex items-center gap-2"><Check aria-hidden="true" className="h-4 w-4 text-emerald-700" />{isAuthenticated ? "Livre complet avec votre compte" : "10 pages à lire sans compte"}</li>
                    <li className="flex items-center gap-2"><Check aria-hidden="true" className="h-4 w-4 text-emerald-700" />Aucun paiement</li>
                  </ul>
                ) : null}

                {selectedCartFormat ? (
                  <div className="mt-5">
                    {cartFormats.length > 1 ? (
                      <div className="mb-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Format">
                        {cartFormats.map((format) => {
                          const active = format.format === selectedCartFormat.format;
                          return (
                            <button key={format.format} type="button" role="radio" aria-checked={active} onClick={() => setCartFormat(format.format)} className={`rounded-sm border px-3 py-2 text-left text-xs transition ${active ? "border-night-900 bg-night-50 ring-1 ring-night-900" : "border-rule-strong hover:border-night-400"}`}>
                              <span className="block font-semibold text-night-900">{getBookFormatLabel(format.format)}</span>
                              <span className="mt-0.5 block tabular-nums text-slate-700">{money(format.price, format.currency_code)}</span>
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
                      className="cta-primary min-h-12 w-full px-6 text-sm"
                    />
                  </div>
                ) : null}

                <div className="mt-3 grid gap-3">
                  {canRead ? (
                    <button type="button" onClick={() => setReaderOpen(true)} className="cta-primary inline-flex min-h-12 items-center justify-center gap-2 px-6 text-sm">
                      <BookOpen aria-hidden="true" className="h-4 w-4" /> {book.is_free && !isAuthenticated ? "Lire 10 pages gratuitement" : "Lire maintenant"}
                    </button>
                  ) : null}
                  {!canRead && book.is_single_sale_enabled ? (
                    <button type="button" onClick={() => setPurchaseOpen((open) => !open)} className="cta-secondary inline-flex min-h-12 items-center justify-center gap-2 px-6 text-sm">
                      <CreditCard aria-hidden="true" className="h-4 w-4" /> {purchaseOpen ? "Fermer" : "Acheter maintenant"}<ChevronDown aria-hidden="true" className={`h-4 w-4 transition ${purchaseOpen ? "rotate-180" : ""}`} />
                    </button>
                  ) : null}
                  {canPreview ? (
                    <button type="button" onClick={() => setReaderOpen(true)} className="inline-flex min-h-11 items-center justify-center gap-2 text-sm font-semibold text-night-900 hover:text-brand-700">
                      <BookOpen aria-hidden="true" className="h-4 w-4" /> Lire un extrait gratuit
                    </button>
                  ) : null}
                  {!canRead && book.is_subscription_available ? <Link href={subscriptionHref} className="inline-flex min-h-11 items-center justify-center gap-2 text-sm font-semibold text-night-900 hover:text-brand-700">Inclus dans Holistique Plus <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link> : null}
                  {accessState?.hasLibraryEntry ? <Link href="/dashboard/reader/library" className="inline-flex min-h-11 items-center justify-center gap-2 text-sm font-semibold text-night-900 hover:text-brand-700"><Library aria-hidden="true" className="h-4 w-4" /> Ma bibliothèque</Link> : null}
                </div>

                {book.is_free && !isAuthenticated ? (
                  <p className="mt-5 border-t border-rule pt-4 text-xs leading-5 text-slate-600">
                    Aucun compte pour commencer : l’inscription n’est demandée qu’après les 10 premières pages.{" "}
                    <Link href={registerHref} className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline"><UserPlus aria-hidden="true" className="h-3.5 w-3.5" />Créer mon compte</Link>
                  </p>
                ) : null}

                <ul className="mt-5 space-y-2 border-t border-rule pt-4 text-xs text-slate-600">
                  <li className="flex items-center gap-2"><LockKeyhole aria-hidden="true" className="h-3.5 w-3.5 text-night-700" /> Paiement sécurisé, mobile money ou carte</li>
                  <li className="flex items-center gap-2"><ShieldCheck aria-hidden="true" className="h-3.5 w-3.5 text-night-700" /> Lecture protégée sur tous vos appareils</li>
                </ul>
              </div>
            </aside>
          </div>

          {(book.purchase_formats.length > 0 || book.subscription_plans.length > 0) ? (
            <section className="mt-16 border-t border-rule pt-10">
              <h2 className="font-display text-2xl font-semibold text-night-900">Éditions et accès</h2>
              <ul className="mt-5 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
                {book.purchase_formats.map((format) => (
                  <li key={format.format} className="flex items-center justify-between gap-3 bg-white p-5">
                    <span>
                      <span className="block font-semibold text-night-900">{getBookFormatLabel(format.format)}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{isPhysicalBookFormat(format.format) ? "Édition imprimée, livrée" : "Lecture web et mobile protégée"}</span>
                    </span>
                    <span className="font-semibold tabular-nums text-night-900">{money(format.price, format.currency_code)}</span>
                  </li>
                ))}
                {book.subscription_plans.map((plan) => (
                  <li key={plan.id} className="flex items-center justify-between gap-3 bg-white p-5">
                    <span>
                      <span className="block font-semibold text-night-900">{plan.name}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">Abonnement mensuel</span>
                    </span>
                    <span className="font-semibold tabular-nums text-night-900">{money(plan.monthly_price, plan.currency_code)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {purchaseOpen && !canRead && book.is_single_sale_enabled ? (
            <section className="hb-fade-up mt-12 scroll-mt-40 border border-rule-strong bg-white p-5 sm:p-8">
              <div className="mb-6">
                <h2 className="font-display text-2xl font-semibold text-night-900">Finaliser l’achat</h2>
                <p className="mt-1 text-sm text-slate-600">Choisissez votre format et votre moyen de paiement.</p>
              </div>
              <CinetPayButtons bookId={book.id} bookTitle={book.title} amount={book.price} currencyCode={book.currency_code} formatOptions={book.purchase_formats.map((format) => ({ format: format.format, label: getBookFormatLabel(format.format), amount: format.price, currencyCode: format.currency_code }))} isAuthenticated={isAuthenticated} loginHref={loginHref} defaultCustomer={checkoutCustomer} />
            </section>
          ) : null}

          <div className="mt-6">
            <BookReviews bookId={book.id} isAuthenticated={isAuthenticated} ratingAvg={book.rating_avg} ratingsCount={book.ratings_count} />
          </div>
        </div>
      </div>
      <ReaderPopup bookId={book.id} open={readerOpen} onClose={() => setReaderOpen(false)} />
    </>
  );
}
