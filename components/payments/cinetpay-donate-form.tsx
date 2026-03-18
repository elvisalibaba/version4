"use client";

import { useMemo, useState } from "react";
import { channelRequiresCardCustomerFields, type CinetPayChannel } from "@/lib/payments/validation";

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

function parseAmount(value: string) {
  const parsed = Number(value.trim().replace(",", "."));
  if (!Number.isFinite(parsed)) return null;
  return Number(parsed.toFixed(2));
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

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phoneNumber.trim()) {
      setError("Nom, prenom, email et telephone sont requis pour lancer le don.");
      return;
    }

    if (channelRequiresCardCustomerFields(channel) && (!address.trim() || !city.trim() || !country.trim() || !zipCode.trim())) {
      setError("Pour la carte bancaire ou le guichet complet, renseignez adresse, ville, pays ISO et code postal.");
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
    <div className="space-y-5 rounded-[1.6rem] border border-violet-100 bg-[linear-gradient(135deg,_rgba(248,245,255,0.96),_rgba(255,255,255,0.96))] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-500">Don via EasyPay</p>
          <p className="mt-2 text-lg font-semibold text-slate-950">Soutenir Holistique Books</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Votre don passe par EasyPay, avec verification serveur du statut de transaction.
          </p>
        </div>
        <span className="catalog-badge">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(parsedAmount ?? 0)}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {suggestedAmounts.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setAmountInput(String(value))}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400"
          >
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            }).format(value)}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Montant (USD)" hint="Minimum 1 USD.">
          <input
            type="number"
            min="1"
            step="0.01"
            value={amountInput}
            onChange={(event) => setAmountInput(event.target.value)}
            className="ios-input w-full px-4 py-3.5"
          />
        </Field>
        <Field label="Reference donateur" hint="Optionnel, ex: Campagne Mars 2026.">
          <input value={donorReference} onChange={(event) => setDonorReference(event.target.value)} className="ios-input w-full px-4 py-3.5" />
        </Field>
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
        <Field label="Pays" hint="Code ISO a 2 lettres, ex: CI, CD, CM, US, FR.">
          <input value={country} onChange={(event) => setCountry(event.target.value.toUpperCase())} className="ios-input w-full px-4 py-3.5" placeholder="CI" maxLength={2} />
        </Field>
        <Field label="Etat / Province" hint="Utile surtout pour US et CA.">
          <input value={state} onChange={(event) => setState(event.target.value.toUpperCase())} className="ios-input w-full px-4 py-3.5" placeholder="CI" maxLength={32} />
        </Field>
        <Field label="Code postal">
          <input value={zipCode} onChange={(event) => setZipCode(event.target.value)} className="ios-input w-full px-4 py-3.5" />
        </Field>
        <Field label="Message" hint="Optionnel, 240 caracteres max.">
          <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} maxLength={240} className="ios-input w-full px-4 py-3.5" />
        </Field>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <button
          type="button"
          onClick={() => launchDonation("CREDIT_CARD")}
          disabled={Boolean(busyChannel)}
          className="cta-primary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busyChannel === "CREDIT_CARD" ? "Redirection..." : "Don par carte"}
        </button>
        <button
          type="button"
          onClick={() => launchDonation("MOBILE_MONEY")}
          disabled={Boolean(busyChannel)}
          className="cta-secondary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busyChannel === "MOBILE_MONEY" ? "Redirection..." : "Don mobile money"}
        </button>
        <button
          type="button"
          onClick={() => launchDonation("ALL")}
          disabled={Boolean(busyChannel)}
          className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busyChannel === "ALL" ? "Redirection..." : "Choisir sur le guichet"}
        </button>
      </div>

      <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
        Le guichet EasyPay affiche les moyens disponibles selon votre pays. Pour la carte bancaire, adresse, ville, pays ISO et code postal sont requis.
      </div>

      {error ? <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
    </div>
  );
}
