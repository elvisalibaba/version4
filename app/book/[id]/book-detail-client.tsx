"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, CreditCard, Library,
  LockKeyhole, ShieldCheck, UserPlus,
} from "lucide-react";
import { FavoriteBookButton } from "@/components/books/favorite-book-button";
import { CinetPayButtons } from "@/components/payments/cinetpay-buttons";
import { ReaderPopup } from "@/components/reader/reader-popup";
import { getLibraryAccessLabel } from "@/lib/access-labels";
import { getBookFormatLabel, type CheckoutBookFormat } from "@/lib/book-formats";

type SubscriptionPlan = { id: string; name: string; slug: string; monthly_price: number; currency_code: string; is_active: boolean };
type BookDetailView = {
  id: string; author_id: string; title: string; subtitle: string | null; description: string | null;
  author_name: string; author_avatar_url?: string | null; cover_signed_url: string | null; price: number;
  currency_code: string; display_price_label: string; offer_summary_label: string; categories: string[];
  language?: string | null; page_count?: number | null; is_favorite?: boolean; is_free: boolean;
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
  const returnPath = `/book/${book.id}`;
  const loginHref = `/login?next=${encodeURIComponent(returnPath)}`;
  const registerHref = `/register?role=reader&next=${encodeURIComponent(returnPath)}`;
  const subscriptionHref = isAuthenticated ? "/dashboard/reader/subscriptions" : loginHref;
  const accessMessage = book.is_free
    ? "Cette édition numérique est offerte. Commencez la lecture immédiatement, sans paiement."
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
      <div className="min-h-screen bg-[#f8f4ed] text-[#1d1a17]">
        <section className="relative overflow-hidden bg-[#173f38] text-white">
          <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(30deg,transparent_48%,rgba(255,255,255,.16)_49%,rgba(255,255,255,.16)_51%,transparent_52%),linear-gradient(150deg,transparent_48%,rgba(255,255,255,.08)_49%,rgba(255,255,255,.08)_51%,transparent_52%)] [background-size:70px_120px]" />
          <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-[#e85d3f]/30 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-6 sm:px-6 sm:pb-20 lg:px-8">
            <Link href="/books" className="inline-flex min-h-10 items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-white/62 transition hover:text-white"><ArrowLeft className="h-4 w-4" /> Retour à la librairie</Link>
            <div className="mt-5 grid gap-8 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-center lg:grid-cols-[330px_minmax(0,1fr)] lg:gap-16">
              <div className="mx-auto w-[190px] overflow-hidden rounded-[1.3rem] bg-[#e5d9c9] shadow-[0_35px_75px_rgba(0,0,0,.38)] sm:mx-0 sm:w-[220px] lg:w-[330px]">
                <div className="aspect-[0.69]">{book.cover_signed_url ? <Image src={book.cover_signed_url} alt={`Couverture de ${book.title}`} width={660} height={960} priority className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center bg-[linear-gradient(145deg,#e9c46a,#c7573d)] p-8 text-center font-display text-xl font-extrabold">{book.title}</div>}</div>
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1.5 text-[0.66rem] font-extrabold uppercase tracking-[0.1em] ${book.is_free ? "bg-[#f5b942] text-[#2d281f]" : "bg-white/12 text-white"}`}>{book.is_free ? "Lecture gratuite" : book.offer_summary_label}</span>
                  {accessType ? <span className="rounded-full bg-[#e85d3f] px-3 py-1.5 text-[0.66rem] font-extrabold uppercase tracking-[0.1em] text-white">{getLibraryAccessLabel(accessType, !accessState?.isSubscriptionEntitlementExpired)}</span> : null}
                </div>
                <h1 className="mt-5 max-w-4xl font-display text-3xl font-extrabold leading-[1.03] tracking-[-0.05em] sm:text-4xl lg:text-6xl">{book.title}</h1>
                {book.subtitle ? <p className="mt-4 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">{book.subtitle}</p> : null}
                <Link href={`/authors/${book.author_id}`} className="mt-6 inline-flex items-center gap-3 font-bold text-[#f4c35e] transition hover:text-[#ffdc8b]">
                  {book.author_avatar_url ? <Image src={book.author_avatar_url} alt="" width={38} height={38} className="h-9 w-9 rounded-full object-cover ring-2 ring-white/20" /> : <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-xs">HB</span>}
                  <span><span className="block text-[0.62rem] uppercase tracking-[0.14em] text-white/45">Un livre de</span>{book.author_name}</span>
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
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#c34d35]">À propos du livre</p>
                <h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.04em]">Une histoire à découvrir</h2>
                <div className="mt-6 whitespace-pre-line font-serif text-[1.05rem] leading-9 text-[#51483f] sm:text-lg">{book.description?.trim() || "La présentation éditoriale de ce titre sera bientôt disponible."}</div>
              </section>

              <section className="mt-12 border-t border-[#ded2c6] pt-10">
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#c34d35]">Formats disponibles</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {book.purchase_formats.map((format) => <div key={format.format} className="flex items-center justify-between gap-3 rounded-2xl border border-[#ded2c6] bg-white p-4"><div><p className="font-extrabold">{getBookFormatLabel(format.format)}</p><p className="mt-1 text-xs text-[#80746a]">Lecture web et mobile sécurisée</p></div><p className="font-extrabold text-[#176052]">{money(format.price, format.currency_code)}</p></div>)}
                  {book.subscription_plans.map((plan) => <div key={plan.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[#f0e8df] p-4"><div><p className="font-extrabold">{plan.name}</p><p className="mt-1 text-xs text-[#80746a]">Abonnement mensuel</p></div><p className="font-extrabold text-[#b9432d]">{money(plan.monthly_price, plan.currency_code)}</p></div>)}
                </div>
              </section>

              <section className="mt-10 rounded-[1.8rem] bg-[#efe5d9] p-6 sm:p-8">
                <div className="flex items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#173f38] text-[#f5b942]"><ShieldCheck className="h-5 w-5" /></span><div><h2 className="font-display text-xl font-extrabold">Une lecture pensée pour vous</h2><p className="mt-2 text-sm leading-7 text-[#665c53]">Lisez sur téléphone, tablette ou ordinateur. Votre bibliothèque, votre progression et vos notes restent liées à votre compte.</p></div></div>
              </section>
            </div>

            <aside className="lg:sticky lg:top-28">
              <div className="rounded-[2rem] border border-[#ded2c6] bg-[#fffdf9] p-6 shadow-[0_24px_60px_rgba(42,33,25,.10)]">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#c34d35]">Votre accès</p>
                <p className="mt-3 font-display text-3xl font-extrabold tracking-[-0.04em]">{book.display_price_label}</p>
                <p className="mt-3 text-sm leading-7 text-[#6b6057]">{accessMessage}</p>
                {book.is_free ? <div className="mt-5 space-y-2 text-sm font-semibold text-[#51483f]"><p className="flex items-center gap-2"><Check className="h-4 w-4 text-[#168164]" />Lecture immédiate</p><p className="flex items-center gap-2"><Check className="h-4 w-4 text-[#168164]" />Aucun paiement</p></div> : null}

                <div className="mt-6 grid gap-3">
                  {canRead ? <button type="button" onClick={() => setReaderOpen(true)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#e85d3f] px-6 text-sm font-extrabold text-white transition hover:bg-[#cf4d33]"><BookOpen className="h-4 w-4" /> Lire maintenant</button> : null}
                  {!canRead && book.is_single_sale_enabled ? <button type="button" onClick={() => setPurchaseOpen((open) => !open)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#e85d3f] px-6 text-sm font-extrabold text-white transition hover:bg-[#cf4d33]"><CreditCard className="h-4 w-4" /> {purchaseOpen ? "Fermer" : "Acheter ce livre"}<ChevronDown className={`h-4 w-4 transition ${purchaseOpen ? "rotate-180" : ""}`} /></button> : null}
                  {!canRead && book.is_subscription_available ? <Link href={subscriptionHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#173f38] px-6 text-sm font-extrabold text-white">Lire avec Holistique Plus <ArrowRight className="h-4 w-4" /></Link> : null}
                  {accessState?.hasLibraryEntry ? <Link href="/dashboard/reader/library" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#ded2c6] text-sm font-bold"><Library className="h-4 w-4" /> Ma bibliothèque</Link> : null}
                </div>
                {book.is_free && !isAuthenticated ? <Link href={registerHref} className="mt-5 inline-flex items-start gap-2 border-t border-[#e8ddd2] pt-5 text-xs font-semibold leading-5 text-[#8a5444]"><UserPlus className="mt-0.5 h-4 w-4 shrink-0" />Créer un compte pour conserver progression et notes</Link> : null}
                <p className="mt-5 flex items-center gap-2 text-[0.68rem] font-semibold text-[#8b7f74]"><LockKeyhole className="h-3.5 w-3.5" /> Paiement sécurisé et accès après confirmation</p>
              </div>
            </aside>
          </div>

          {purchaseOpen && !canRead && book.is_single_sale_enabled ? (
            <section className="mt-12 scroll-mt-28 rounded-[2rem] border border-[#ded2c6] bg-white p-5 sm:p-8">
              <div className="mb-6"><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#c34d35]">Finaliser l’achat</p><h2 className="mt-2 font-display text-2xl font-extrabold">Vos informations de paiement</h2><p className="mt-2 text-sm text-[#756a61]">Choisissez votre format et le moyen de paiement qui vous convient.</p></div>
              <CinetPayButtons bookId={book.id} bookTitle={book.title} amount={book.price} currencyCode={book.currency_code} formatOptions={book.purchase_formats.map((format) => ({ format: format.format, label: getBookFormatLabel(format.format), amount: format.price, currencyCode: format.currency_code }))} isAuthenticated={isAuthenticated} loginHref={loginHref} defaultCustomer={checkoutCustomer} />
            </section>
          ) : null}

          {book.is_free && paidFormats.length > 0 ? <section className="mt-10 rounded-[1.8rem] border border-[#ded2c6] bg-white p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#c34d35]">Éditions imprimées</p><h2 className="mt-2 font-display text-xl font-extrabold">La lecture numérique reste gratuite.</h2></div><button type="button" onClick={() => setPurchaseOpen((open) => !open)} className="min-h-11 rounded-full border border-[#d8cabc] px-5 text-sm font-bold">{purchaseOpen ? "Fermer" : "Commander une édition"}</button></div>{purchaseOpen ? <div className="mt-6"><CinetPayButtons bookId={book.id} bookTitle={book.title} amount={paidFormats[0].price} currencyCode={paidFormats[0].currency_code} formatOptions={paidFormats.map((format) => ({ format: format.format, label: getBookFormatLabel(format.format), amount: format.price, currencyCode: format.currency_code }))} isAuthenticated={isAuthenticated} loginHref={loginHref} defaultCustomer={checkoutCustomer} /></div> : null}</section> : null}
        </main>
      </div>
      <ReaderPopup bookId={book.id} open={readerOpen} onClose={() => setReaderOpen(false)} />
    </>
  );
}
