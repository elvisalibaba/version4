"use client";

import { useState } from "react";
import Link from "next/link";
import { getBookFormatLabel, type CheckoutBookFormat } from "@/lib/book-formats";
import { channelRequiresCardCustomerFields, type CinetPayChannel } from "@/lib/payments/validation";

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
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      {children}
      {hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
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

    if (channelRequiresCardCustomerFields(channel) && (!address.trim() || !city.trim() || !country.trim() || !zipCode.trim())) {
      setBusyChannel(null);
      setError("Pour la carte bancaire ou le guichet complet, renseignez adresse, ville, pays ISO et code postal.");
      return;
    }

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
          currency: "USD",
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

  const currencyMismatch = effectiveCurrencyCode !== "USD";

  return (
    <div className="space-y-5 rounded-[1.6rem] border border-violet-100 bg-[linear-gradient(135deg,_rgba(248,245,255,0.96),_rgba(255,255,255,0.96))] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-500">EasyPay checkout</p>
          <p className="mt-2 text-lg font-semibold text-slate-950">{bookTitle}</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Paiement en redirection avec verification serveur obligatoire. Les achats numeriques debloquent la bibliotheque apres confirmation.
          </p>
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
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Format</p>
          <div className="flex flex-wrap gap-2">
            {formatOptions.map((option) => {
              const isActive = option.format === selectedFormat;
              return (
                <button
                  key={option.format}
                  type="button"
                  onClick={() => setSelectedFormat(option.format)}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                    isActive ? "border-violet-500 bg-violet-100 text-violet-700" : "border-slate-200 bg-white text-slate-600 hover:border-violet-300"
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
        <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Ce livre n est pas facture en USD. Le checkout EasyPay est actuellement limite a USD.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Prenom">
          <input value={firstName} onChange={(event) => setFirstName(event.target.value)} className="ios-input w-full px-4 py-3.5" />
        </Field>
        <Field label="Nom">
          <input value={lastName} onChange={(event) => setLastName(event.target.value)} className="ios-input w-full px-4 py-3.5" />
        </Field>
        <Field label="Email">
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="ios-input w-full px-4 py-3.5" />
        </Field>
        <Field label="Telephone">
          <input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} className="ios-input w-full px-4 py-3.5" />
        </Field>
        <Field label="Adresse" hint="Obligatoire pour carte bancaire et ALL.">
          <input value={address} onChange={(event) => setAddress(event.target.value)} className="ios-input w-full px-4 py-3.5" />
        </Field>
        <Field label="Ville">
          <input value={city} onChange={(event) => setCity(event.target.value)} className="ios-input w-full px-4 py-3.5" />
        </Field>
        <Field label="Pays" hint="Code ISO a 2 lettres, ex: CD, CI, CM, US, FR.">
          <input value={country} onChange={(event) => setCountry(event.target.value.toUpperCase())} className="ios-input w-full px-4 py-3.5" placeholder="CI" maxLength={2} />
        </Field>
        <Field label="Etat / Province" hint="Utile surtout pour US et CA. Sinon nous reutilisons le pays ISO.">
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
          className="cta-primary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busyChannel === "CREDIT_CARD" ? "Redirection..." : "Payer par carte"}
        </button>
        <button
          type="button"
          onClick={() => launchCheckout("MOBILE_MONEY")}
          disabled={Boolean(busyChannel) || currencyMismatch}
          className="cta-secondary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busyChannel === "MOBILE_MONEY" ? "Redirection..." : "Payer par mobile money"}
        </button>
        <button
          type="button"
          onClick={() => launchCheckout("ALL")}
          disabled={Boolean(busyChannel) || currencyMismatch}
          className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busyChannel === "ALL" ? "Redirection..." : "Choisir sur le guichet"}
        </button>
      </div>

      {!isAuthenticated ? (
        <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          Connectez-vous avant de lancer un paiement.
          {" "}
          <Link href={loginHref} className="font-semibold text-violet-700 hover:text-violet-800">
            Ouvrir la connexion
          </Link>
        </div>
      ) : null}

      <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
        Le guichet EasyPay affiche les moyens disponibles selon votre contexte. Pour payer par carte, renseignez au minimum l adresse, la ville, le pays en code ISO a 2 lettres et le code postal.
      </div>

      {error ? <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
    </div>
  );
}
