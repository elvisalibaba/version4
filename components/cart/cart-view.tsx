"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, LockKeyhole, Minus, Plus, ShieldCheck, ShoppingCart, Trash2, Truck } from "lucide-react";
import { CinetPayButtons } from "@/components/payments/cinetpay-buttons";
import { formatMoney, subtotalsByCurrency } from "@/components/cart/money";
import { getBookFormatLabel, isPhysicalBookFormat } from "@/lib/book-formats";
import { PENDING_ORDER_KEY, cartCount, lineKey, removeFromCart, setCartQuantity, useCart, type CartItem } from "@/lib/cart";

type Customer = {
  customerId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  city?: string | null;
  country?: string | null;
};

type PendingOrder = { id: string; total: number; currencyCode: string; signature: string };

const PAYABLE_CURRENCIES = ["USD", "CDF"];

function signatureOf(items: CartItem[]) {
  return items.map((item) => `${lineKey(item)}x${item.quantity}`).sort().join("|");
}

function readApiError(payload: unknown) {
  if (payload && typeof payload === "object") {
    const data = payload as { message?: string; error?: string; errors?: Record<string, string[]> };
    const first = data.errors ? Object.values(data.errors).flat()[0] : undefined;
    return first ?? data.message ?? data.error;
  }
  return undefined;
}

export function CartView({ isAuthenticated, customer }: { isAuthenticated: boolean; customer: Customer | null }) {
  const items = useCart();
  const [removing, setRemoving] = useState<string | null>(null);
  const subtotals = useMemo(() => subtotalsByCurrency(items), [items]);
  const [currency, setCurrency] = useState<string | null>(null);
  const activeCurrency = currency && subtotals.some((entry) => entry.currencyCode === currency) ? currency : subtotals[0]?.currencyCode ?? "USD";
  const payableItems = items.filter((item) => item.currencyCode === activeCurrency);
  const signature = signatureOf(payableItems);
  const [order, setOrder] = useState<PendingOrder | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const count = cartCount(items);
  const hasPhysical = items.some((item) => isPhysicalBookFormat(item.format));
  // Toute modification du panier invalide la commande préparée.
  const activeOrder = order && order.signature === signature ? order : null;

  function remove(key: string) {
    setRemoving(key);
    window.setTimeout(() => {
      removeFromCart(key);
      setRemoving(null);
    }, 260);
  }

  async function prepareOrder() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/backend/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          currency_code: activeCurrency,
          items: payableItems.map((item) => ({ book_id: item.bookId, book_format: item.format, quantity: item.quantity })),
        }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(readApiError(payload) ?? "Impossible de préparer la commande. Réessayez dans un instant.");
      }
      const data = (payload as { data: { id: string; total_price: number | string; currency_code: string } }).data;
      setOrder({ id: data.id, total: Number(data.total_price), currencyCode: data.currency_code, signature });
      try {
        // Permet de retirer ces lignes du panier au retour de paiement.
        window.localStorage.setItem(PENDING_ORDER_KEY, JSON.stringify({ orderId: data.id, keys: payableItems.map((item) => lineKey(item)) }));
      } catch {
        // Sans stockage, le client videra son panier à la main.
      }
    } catch (prepareError) {
      setError(prepareError instanceof Error ? prepareError.message : "Impossible de préparer la commande.");
    } finally {
      setBusy(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="hb-fade-up mx-auto max-w-xl rounded-md border border-rule bg-white px-6 py-14 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-paper-deep text-slate-500">
          <ShoppingCart className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-2xl font-bold text-slate-900">Votre panier est vide</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Ajoutez des livres depuis leur fiche : ils vous attendront ici, même si vous fermez la page.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Link href="/books" className="cta-primary inline-flex min-h-11 items-center justify-center px-5 text-sm">Parcourir les livres</Link>
          <Link href="/books?access=free" className="cta-secondary inline-flex min-h-11 items-center justify-center px-5 text-sm">Lire gratuitement</Link>
        </div>
        {!isAuthenticated ? (
          <p className="mt-6 text-sm text-slate-600">
            Déjà client ? <Link href="/login?next=%2Fcart" className="font-semibold text-brand-700 hover:underline">Identifiez-vous</Link> pour retrouver vos achats.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <section className="rounded-md border border-rule bg-white" aria-labelledby="cart-title">
        <div className="flex items-end justify-between gap-4 border-b border-rule px-5 py-5 sm:px-6">
          <div>
            <h1 id="cart-title" className="text-2xl font-bold text-slate-900">Panier</h1>
            <p className="mt-1 text-sm text-slate-600">{count} article{count > 1 ? "s" : ""}</p>
          </div>
          <span className="hidden text-sm text-slate-500 sm:block">Prix</span>
        </div>

        <ul className="divide-y divide-rule">
          {items.map((item) => {
            const key = lineKey(item);
            const physical = isPhysicalBookFormat(item.format);
            return (
              <li key={key} className={`hb-cart-line px-5 py-5 sm:px-6 ${removing === key ? "is-removing" : ""}`}>
                <div className="flex gap-4">
                  <Link href={`/book/${item.bookId}`} className="relative h-32 w-[5.3rem] shrink-0 overflow-hidden rounded border border-rule bg-night-900 sm:h-36 sm:w-24">
                    {item.coverUrl ? (
                      <Image src={item.coverUrl} alt={`Couverture de ${item.title}`} fill sizes="96px" className="object-cover" />
                    ) : (
                      <span className="flex h-full items-end p-2 text-[0.7rem] font-semibold leading-tight text-white">{item.title}</span>
                    )}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:justify-between sm:gap-6">
                    <div className="min-w-0">
                      <Link href={`/book/${item.bookId}`} className="line-clamp-2 font-semibold text-slate-900 hover:text-brand-700 hover:underline">{item.title}</Link>
                      {item.authorName ? <p className="mt-0.5 text-sm text-slate-600">{item.authorName}</p> : null}
                      <p className="mt-1 text-sm text-slate-600">{getBookFormatLabel(item.format)}</p>
                      <p className="mt-1 text-xs font-semibold text-emerald-700">{physical ? "Expédition après confirmation" : "Disponible immédiatement après paiement"}</p>

                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        {physical ? (
                          <div className="inline-flex h-9 items-center overflow-hidden rounded-md border border-rule-strong" role="group" aria-label={`Quantité pour ${item.title}`}>
                            <button type="button" onClick={() => (item.quantity <= 1 ? remove(key) : setCartQuantity(key, item.quantity - 1))} className="grid h-full w-9 place-items-center text-slate-700 transition hover:bg-paper-deep" aria-label="Diminuer la quantité">
                              {item.quantity <= 1 ? <Trash2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                            </button>
                            <span key={item.quantity} className="hb-qty-tick grid h-full min-w-9 place-items-center border-x border-rule-strong px-2 text-sm font-semibold tabular-nums" aria-live="polite">{item.quantity}</span>
                            <button type="button" onClick={() => setCartQuantity(key, item.quantity + 1)} className="grid h-full w-9 place-items-center text-slate-700 transition hover:bg-paper-deep" aria-label="Augmenter la quantité">
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        ) : null}
                        <button type="button" onClick={() => remove(key)} className="text-sm font-medium text-brand-700 hover:underline">
                          Supprimer
                        </button>
                      </div>
                    </div>
                    <p className="order-first text-base font-bold text-slate-900 sm:order-none sm:text-right">
                      {formatMoney(item.unitPrice * item.quantity, item.currencyCode)}
                      {item.quantity > 1 ? <span className="block text-xs font-normal text-slate-500">{formatMoney(item.unitPrice, item.currencyCode)} l’unité</span> : null}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-between gap-4 border-t border-rule px-5 py-4 sm:px-6">
          <Link href="/books" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-brand-700">
            <ArrowLeft className="h-4 w-4" /> Continuer mes achats
          </Link>
          <p className="text-right text-sm text-slate-700">
            Sous-total : <strong className="text-slate-900">{subtotals.map((entry) => formatMoney(entry.total, entry.currencyCode)).join(" + ")}</strong>
          </p>
        </div>
      </section>

      <aside className="space-y-4 lg:sticky lg:top-32">
        <div className="rounded-md border border-rule bg-white p-5">
          {subtotals.length > 1 ? (
            <fieldset className="mb-4">
              <legend className="text-sm font-semibold text-slate-900">Payer en</legend>
              <p className="mt-1 text-xs leading-5 text-slate-600">Une commande se règle dans une seule devise. Les autres articles restent dans votre panier.</p>
              <div className="mt-3 grid gap-2">
                {subtotals.map((entry) => (
                  <label key={entry.currencyCode} className={`flex cursor-pointer items-center justify-between rounded-md border px-3 py-2 text-sm transition ${entry.currencyCode === activeCurrency ? "border-night-900 bg-night-50" : "border-rule-strong hover:border-slate-400"}`}>
                    <span className="flex items-center gap-2">
                      <input type="radio" name="cart-currency" checked={entry.currencyCode === activeCurrency} onChange={() => setCurrency(entry.currencyCode)} className="accent-night-900" />
                      {entry.currencyCode}
                    </span>
                    <strong>{formatMoney(entry.total, entry.currencyCode)}</strong>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          <p className="flex items-baseline justify-between gap-3 text-lg text-slate-900">
            <span>Total</span>
            <strong key={signature} className="hb-total-tick text-2xl">{formatMoney(subtotals.find((entry) => entry.currencyCode === activeCurrency)?.total ?? 0, activeCurrency)}</strong>
          </p>
          <p className="mt-1 text-xs text-slate-500">Montant final confirmé par nos serveurs avant paiement (promotions incluses).</p>

          {!PAYABLE_CURRENCIES.includes(activeCurrency) ? (
            <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Le paiement en ligne accepte l’USD et le CDF. Contactez-nous pour régler cette commande.
            </p>
          ) : !isAuthenticated ? (
            <Link href="/login?next=%2Fcart" className="cta-primary mt-5 inline-flex min-h-12 w-full items-center justify-center text-[0.95rem]">
              Se connecter pour payer
            </Link>
          ) : activeOrder ? null : (
            <button type="button" onClick={prepareOrder} disabled={busy} className="cta-primary mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 text-[0.95rem] disabled:cursor-wait disabled:opacity-70">
              {busy ? <span className="hb-spinner" aria-hidden="true" /> : <LockKeyhole className="h-4 w-4" />}
              {busy ? "Préparation…" : `Passer la commande (${payableItems.length})`}
            </button>
          )}

          {error ? <p className="hb-shake mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{error}</p> : null}

          <ul className="mt-5 space-y-2 border-t border-rule pt-4 text-xs text-slate-600">
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-night-700" /> Paiement sécurisé par carte ou mobile money</li>
            <li className="flex items-center gap-2"><LockKeyhole className="h-4 w-4 shrink-0 text-night-700" /> Livres numériques ajoutés à votre bibliothèque</li>
            {hasPhysical ? <li className="flex items-center gap-2"><Truck className="h-4 w-4 shrink-0 text-night-700" /> Livraison des éditions imprimées organisée après confirmation</li> : null}
          </ul>
        </div>
      </aside>

      {activeOrder ? (
        <section className="hb-fade-up rounded-md border border-rule bg-white p-5 sm:p-6 lg:col-span-2" aria-label="Paiement">
          <CinetPayButtons
            orderId={activeOrder.id}
            bookTitle={`Commande de ${payableItems.length} livre${payableItems.length > 1 ? "s" : ""}`}
            amount={activeOrder.total}
            currencyCode={activeOrder.currencyCode}
            isAuthenticated={isAuthenticated}
            loginHref="/login?next=%2Fcart"
            defaultCustomer={customer}
          />
        </section>
      ) : null}
    </div>
  );
}
