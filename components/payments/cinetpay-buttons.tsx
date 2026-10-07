"use client";

import { useState } from "react";
import Link from "next/link";
import { getBookFormatLabel, type CheckoutBookFormat } from "@/lib/book-formats";
import { type CinetPayChannel } from "@/lib/payments/validation";

type CustomerDefaults = {
  customerId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  state?: string | null;
  zipCode?: string | null;
};

type CheckoutFormatOption = {
  format: CheckoutBookFormat;
  label: string;
  amount: number;
  currencyCode: string;
};

type CinetPayButtonsProps = {
  bookId?: string;
  orderId?: string;
  bookTitle: string;
  amount: number;
  currencyCode: string;
  formatOptions?: CheckoutFormatOption[];
  isAuthenticated: boolean;
  loginHref: string;
  defaultCustomer?: CustomerDefaults | null;
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-bold text-slate-700">{label}</span>
      {children}
      {hint ? <span className="text-xs leading-5 text-slate-500">{hint}</span> : null}
    </label>
  );
}

export function CinetPayButtons({
  bookId,
  orderId,
  bookTitle,
  amount,
  currencyCode,
  formatOptions = [],
  isAuthenticated,
  loginHref,
  defaultCustomer,
}: CinetPayButtonsProps) {
  const [firstName, setFirstName] = useState(defaultCustomer?.firstName ?? "");
  const [lastName, setLastName] = useState(defaultCustomer?.lastName ?? "");
  const [email, setEmail] = useState(defaultCustomer?.email ?? "");
  const [phoneNumber, setPhoneNumber] = useState(defaultCustomer?.phoneNumber ?? "");
  const [address, setAddress] = useState(defaultCustomer?.address ?? "");
  const [city, setCity] = useState(defaultCustomer?.city ?? "");
  const [country, setCountry] = useState(defaultCustomer?.country ?? "");
  const [state, setState] = useState(defaultCustomer?.state ?? "");
  const [zipCode, setZipCode] = useState(defaultCustomer?.zipCode ?? "");
  const [selectedFormat, setSelectedFormat] = useState<CheckoutFormatOption["format"]>(formatOptions[0]?.format ?? "ebook");
  const [busyChannel, setBusyChannel] = useState<CinetPayChannel | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedFormatOption = formatOptions.find((option) => option.format === selectedFormat) ?? formatOptions[0] ?? null;
  const effectiveAmount = selectedFormatOption?.amount ?? amount;
  const effectiveCurrencyCode = selectedFormatOption?.currencyCode ?? currencyCode;

  async function launchCheckout(channel: CinetPayChannel) {
    if (!isAuthenticated) {
      window.location.assign(loginHref);
      return;
    }

    setBusyChannel(channel);
    setError(null);

    const customer = {
      customerId: defaultCustomer?.customerId ?? null,
      firstName,
      lastName,
      email,
      phoneNumber,
      address,
      city,
      country,
      state,
      zipCode,
    };

    try {
      const response = await fetch("/api/payments/easypay/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookId,
          orderId,
          bookFormat: selectedFormatOption?.format,
          channels: channel,
          currency: effectiveCurrencyCode,
          customer,
        }),
      });

      const data = (await response.json()) as { error?: string; paymentUrl?: string };

      if (!response.ok || !data.paymentUrl) {
        throw new Error(data.error ?? "Impossible de lancer le paiement EasyPay.");
      }

      window.location.assign(data.paymentUrl);
    } catch (checkoutError) {
      setBusyChannel(null);
      setError(checkoutError instanceof Error ? checkoutError.message : "Impossible de lancer le paiement.");
    }
  }

  const currencyMismatch = !["USD", "CDF"].includes(effectiveCurrencyCode);

  return (
    <div className="space-y-6 rounded-xl bg-slate-100 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold text-brand-600">Commande sécurisée</p>
          <p className="mt-2 font-display text-xl font-extrabold text-slate-900">{bookTitle}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">Votre livre sera ajouté à votre bibliothèque dès la confirmation du paiement.</p>
        </div>
        <span className="catalog-badge">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: effectiveCurrencyCode,
          }).format(effectiveAmount)}
        </span>
      </div>

      {formatOptions.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-extrabold text-brand-700">Choisir le format</p>
          <div className="flex flex-wrap gap-2">
            {formatOptions.map((option) => {
              const isActive = option.format === selectedFormat;
              return (
                <button
                  key={option.format}
                  type="button"
                  onClick={() => setSelectedFormat(option.format)}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                    isActive ? "border-night-900 bg-night-900 text-white" : "border-slate-300 bg-white text-slate-600 hover:border-brand-600"
                  }`}
                >
                  {option.label || getBookFormatLabel(option.format)} -{" "}
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: option.currencyCode,
                  }).format(option.amount)}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {currencyMismatch ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          EasyPay accepte les paiements en USD ou CDF. La devise de ce livre n’est pas compatible.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Prénom">
          <input value={firstName} onChange={(event) => setFirstName(event.target.value)} className="ios-input w-full px-4 py-3.5" />
        </Field>
        <Field label="Nom">
          <input value={lastName} onChange={(event) => setLastName(event.target.value)} className="ios-input w-full px-4 py-3.5" />
        </Field>
        <Field label="Email">
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="ios-input w-full px-4 py-3.5" />
        </Field>
        <Field label="Téléphone">
          <input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} className="ios-input w-full px-4 py-3.5" />
        </Field>
        <Field label="Adresse" hint="Demandée uniquement pour certains paiements par carte.">
          <input value={address} onChange={(event) => setAddress(event.target.value)} className="ios-input w-full px-4 py-3.5" />
        </Field>
        <Field label="Ville">
          <input value={city} onChange={(event) => setCity(event.target.value)} className="ios-input w-full px-4 py-3.5" />
        </Field>
        <Field label="Pays" hint="Code à deux lettres : CD, CI, CM, FR…">
          <input value={country} onChange={(event) => setCountry(event.target.value.toUpperCase())} className="ios-input w-full px-4 py-3.5" placeholder="CI" maxLength={2} />
        </Field>
        <Field label="État / Province" hint="Facultatif selon votre pays.">
          <input value={state} onChange={(event) => setState(event.target.value.toUpperCase())} className="ios-input w-full px-4 py-3.5" placeholder="CI" maxLength={32} />
        </Field>
        <Field label="Code postal">
          <input value={zipCode} onChange={(event) => setZipCode(event.target.value)} className="ios-input w-full px-4 py-3.5" />
        </Field>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <button
          type="button"
          onClick={() => launchCheckout("CREDIT_CARD")}
          disabled={Boolean(busyChannel) || currencyMismatch}
          className="rounded-full bg-brand-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busyChannel === "CREDIT_CARD" ? "Redirection..." : "Payer par carte"}
        </button>
        <button
          type="button"
          onClick={() => launchCheckout("MOBILE_MONEY")}
          disabled={Boolean(busyChannel) || currencyMismatch}
          className="rounded-full bg-night-900 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-night-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busyChannel === "MOBILE_MONEY" ? "Redirection..." : "Payer par mobile money"}
        </button>
        <button
          type="button"
          onClick={() => launchCheckout("ALL")}
          disabled={Boolean(busyChannel) || currencyMismatch}
          className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-extrabold text-slate-800 transition hover:border-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busyChannel === "ALL" ? "Redirection..." : "Choisir sur le guichet"}
        </button>
      </div>

      {!isAuthenticated ? (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          Connectez-vous pour effectuer l’achat.
          {" "}
          <Link href={loginHref} className="font-semibold text-brand-700 hover:text-brand-800">
            Ouvrir la connexion
          </Link>
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-600">Carte bancaire et mobile money sont proposés selon votre pays et votre opérateur.</div>

      {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
    </div>
  );
}
