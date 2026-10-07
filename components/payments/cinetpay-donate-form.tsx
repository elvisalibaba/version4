"use client";

import { useMemo, useState } from "react";
import { ChevronDown, HeartHandshake } from "lucide-react";
import { type CinetPayChannel } from "@/lib/payments/validation";

type DonationCustomerDefaults = {
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

type CinetPayDonateFormProps = {
  defaultCustomer?: DonationCustomerDefaults | null;
  suggestedAmounts?: number[];
};

const inputClassName =
  "h-11 w-full rounded-lg border border-slate-400 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-brand-600 focus:ring-2 focus:ring-brand-200";

const textareaClassName =
  "w-full rounded-lg border border-slate-400 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-brand-600 focus:ring-2 focus:ring-brand-200";

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
    <label className="grid gap-1.5">
      <span className="text-sm font-medium text-slate-900">{label}</span>
      {children}
      {hint ? <span className="text-xs leading-5 text-slate-600">{hint}</span> : null}
    </label>
  );
}

function SectionCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-300 bg-white p-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {hint ? <p className="text-sm leading-6 text-slate-600">{hint}</p> : null}
      </div>
      <div className="mt-4 grid gap-4">{children}</div>
    </section>
  );
}

function parseAmount(value: string) {
  const parsed = Number(value.trim().replace(",", "."));
  if (!Number.isFinite(parsed)) return null;
  return Number(parsed.toFixed(2));
}

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function CinetPayDonateForm({ defaultCustomer, suggestedAmounts = [5, 10, 25, 50] }: CinetPayDonateFormProps) {
  const [amountInput, setAmountInput] = useState(String(suggestedAmounts[1] ?? 10));
  const [firstName, setFirstName] = useState(defaultCustomer?.firstName ?? "");
  const [lastName, setLastName] = useState(defaultCustomer?.lastName ?? "");
  const [email, setEmail] = useState(defaultCustomer?.email ?? "");
  const [phoneNumber, setPhoneNumber] = useState(defaultCustomer?.phoneNumber ?? "");
  const [address, setAddress] = useState(defaultCustomer?.address ?? "");
  const [city, setCity] = useState(defaultCustomer?.city ?? "");
  const [country, setCountry] = useState(defaultCustomer?.country ?? "");
  const [state, setState] = useState(defaultCustomer?.state ?? "");
  const [zipCode, setZipCode] = useState(defaultCustomer?.zipCode ?? "");
  const [donorReference, setDonorReference] = useState("");
  const [note, setNote] = useState("");
  const [busyChannel, setBusyChannel] = useState<CinetPayChannel | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parsedAmount = useMemo(() => parseAmount(amountInput), [amountInput]);

  async function launchDonation(channel: CinetPayChannel) {
    setError(null);

    if (!parsedAmount || parsedAmount <= 0) {
      setError("Entrez un montant valide superieur a zero.");
      return;
    }

    if (parsedAmount < 1) {
      setError("Le montant minimum est de 1 USD.");
      return;
    }

    if (!`${firstName} ${lastName}`.trim()) {
      setError("Le nom du donateur est requis pour lancer le paiement EasyPay.");
      return;
    }

    setBusyChannel(channel);

    try {
      const response = await fetch("/api/payments/easypay/donate/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parsedAmount,
          channels: channel,
          currency: "USD",
          donorReference: donorReference.trim() || null,
          note: note.trim() || null,
          customer: {
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
          },
        }),
      });

      const data = (await response.json()) as { error?: string; paymentUrl?: string };

      if (!response.ok || !data.paymentUrl) {
        throw new Error(data.error ?? "Impossible de lancer le don EasyPay.");
      }

      window.location.assign(data.paymentUrl);
    } catch (donationError) {
      setBusyChannel(null);
      setError(donationError instanceof Error ? donationError.message : "Impossible de lancer le don.");
    }
  }

  return (
    <form className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm sm:p-6" onSubmit={(event) => event.preventDefault()}>
      <div className="space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-night-900 px-3 py-1 text-xs font-semibold text-white">
          <HeartHandshake className="h-3.5 w-3.5" />
          Don EasyPay
        </span>
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-slate-900">Faire un don</h1>
          <p className="text-sm leading-6 text-slate-600">
            Soutenez Holistique Books avec un formulaire plus simple, puis choisissez votre canal de paiement.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <SectionCard title="Montant du don" hint="Choisissez un montant rapide ou entrez votre propre montant.">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-brand-600 bg-brand-50 px-4 py-3">
            <span className="text-sm font-medium text-brand-700">Montant actuel</span>
            <span className="text-lg font-semibold text-slate-900">{formatUsd(parsedAmount ?? 0)}</span>
          </div>

          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            {suggestedAmounts.map((value) => {
              const active = parsedAmount === value;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAmountInput(String(value))}
                  className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "border-night-900 bg-night-900 text-white"
                      : "border-slate-300 bg-white text-slate-900 hover:border-slate-300 hover:bg-night-50"
                  }`}
                >
                  {formatUsd(value)}
                </button>
              );
            })}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Montant (USD)" hint="Minimum 1 USD.">
              <input
                type="number"
                min="1"
                step="0.01"
                value={amountInput}
                onChange={(event) => setAmountInput(event.target.value)}
                className={inputClassName}
              />
            </Field>
            <Field label="Reference donateur" hint="Optionnel, ex: Campagne Mars 2026.">
              <input value={donorReference} onChange={(event) => setDonorReference(event.target.value)} className={inputClassName} />
            </Field>
          </div>

          <Field label="Message" hint="Optionnel, 240 caracteres max.">
            <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} maxLength={240} className={textareaClassName} />
          </Field>
        </SectionCard>

        <SectionCard title="Coordonnées du donateur" hint="Le nom est requis par EasyPay. Email et téléphone restent facultatifs.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Prenom">
              <input value={firstName} onChange={(event) => setFirstName(event.target.value)} className={inputClassName} />
            </Field>
            <Field label="Nom">
              <input value={lastName} onChange={(event) => setLastName(event.target.value)} className={inputClassName} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email">
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClassName} />
            </Field>
            <Field label="Telephone">
              <input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} className={inputClassName} />
            </Field>
          </div>
        </SectionCard>

        <details className="rounded-xl border border-slate-300 bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-semibold text-slate-900 marker:hidden">
            Ajouter les informations de facturation
            <ChevronDown className="h-4 w-4 text-slate-600" />
          </summary>
          <div className="grid gap-4 border-t border-slate-300 px-4 py-4">
            <div className="rounded-lg border border-brand-600 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
              Ces informations sont facultatives pour l’initialisation EasyPay actuelle, mais peuvent être utiles pour votre suivi client.
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Adresse">
                <input value={address} onChange={(event) => setAddress(event.target.value)} className={inputClassName} />
              </Field>
              <Field label="Ville">
                <input value={city} onChange={(event) => setCity(event.target.value)} className={inputClassName} />
              </Field>
              <Field label="Pays" hint="Code ISO a 2 lettres, ex: CI, CD, CM, US, FR.">
                <input
                  value={country}
                  onChange={(event) => setCountry(event.target.value.toUpperCase())}
                  className={inputClassName}
                  placeholder="CI"
                  maxLength={2}
                />
              </Field>
              <Field label="Etat / Province" hint="Utile surtout pour US et CA.">
                <input
                  value={state}
                  onChange={(event) => setState(event.target.value.toUpperCase())}
                  className={inputClassName}
                  placeholder="Abidjan"
                  maxLength={32}
                />
              </Field>
              <Field label="Code postal">
                <input value={zipCode} onChange={(event) => setZipCode(event.target.value)} className={inputClassName} />
              </Field>
            </div>
          </div>
        </details>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-brand-600 bg-brand-50 px-4 py-3 text-sm text-brand-700">{error}</p>
      ) : null}

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <button
          type="button"
          onClick={() => launchDonation("CREDIT_CARD")}
          disabled={Boolean(busyChannel)}
          className="inline-flex h-11 items-center justify-center rounded-full border border-brand-600 bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busyChannel === "CREDIT_CARD" ? "Redirection..." : "Don par carte"}
        </button>
        <button
          type="button"
          onClick={() => launchDonation("MOBILE_MONEY")}
          disabled={Boolean(busyChannel)}
          className="inline-flex h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 transition hover:bg-night-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busyChannel === "MOBILE_MONEY" ? "Redirection..." : "Don mobile money"}
        </button>
        <button
          type="button"
          onClick={() => launchDonation("ALL")}
          disabled={Boolean(busyChannel)}
          className="inline-flex h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 transition hover:bg-night-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busyChannel === "ALL" ? "Redirection..." : "Choisir sur EasyPay"}
        </button>
      </div>

      <div className="mt-4 rounded-lg border border-slate-300 bg-night-50 px-4 py-3 text-sm leading-6 text-slate-600">
        EasyPay affiche les moyens disponibles selon votre pays et votre opérateur.
      </div>
    </form>
  );
}
