"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Mail, MailCheck, ShieldCheck } from "lucide-react";
import { getSafeNextPath, withNextPath } from "@/lib/safe-next-path";

type ForgotPasswordFormProps = {
  nextPath: string;
};

export function ForgotPasswordForm({ nextPath }: ForgotPasswordFormProps) {
  const safeNextPath = getSafeNextPath(nextPath);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);


    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(payload?.message ?? "Impossible d’envoyer le lien de réinitialisation.");
        return;
      }

      setSent(true);
    } catch {
      setError("Le service de récupération est momentanément indisponible.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <section className="mx-auto w-full max-w-lg rounded-md border border-rule bg-paper p-5 text-center sm:rounded-md sm:p-10" aria-labelledby="recovery-sent-title">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-md bg-paper text-brand-600">
          <MailCheck aria-hidden="true" className="h-6 w-6" />
        </span>
        <h1 id="recovery-sent-title" className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-slate-900">Consultez votre email</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
          Si un compte correspond à <strong className="text-slate-900">{email}</strong>, un lien de réinitialisation vient d’être envoyé.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => setSent(false)} className="inline-flex h-11 items-center justify-center rounded-sm border border-rule-strong bg-white px-4 text-sm font-semibold text-slate-900 hover:bg-paper-deep">
            Modifier l’adresse
          </button>
          <Link href={withNextPath("/login", safeNextPath)} className="inline-flex h-11 items-center justify-center rounded-sm bg-night-900 px-4 text-sm font-semibold text-white hover:bg-slate-800">
            Retour à la connexion
          </Link>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={onSubmit} aria-busy={loading} className="relative mx-auto w-full max-w-lg overflow-hidden rounded-md border border-rule bg-paper p-4 sm:rounded-md sm:p-9 lg:p-10">
      <div className="relative grid gap-5 sm:gap-7">
        <header className="space-y-3">
          <span className="inline-flex w-fit items-center gap-2 rounded-sm border border-rule bg-white px-3 py-1.5 text-xs font-bold text-brand-600">
            <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
            Récupération sécurisée
          </span>
          <div className="space-y-2">
            <h1 className="text-[1.9rem] font-semibold leading-[1.08] tracking-[-0.04em] text-slate-900 sm:text-[2.6rem]">Mot de passe oublié ?</h1>
            <p className="text-sm leading-6 text-slate-600">Indiquez l’adresse liée à votre compte. Nous vous enverrons un lien à usage limité.</p>
          </div>
        </header>

        <label className="grid gap-2" htmlFor="recovery-email">
          <span className="text-[0.7rem] font-bold text-slate-600">Adresse email</span>
          <span className="relative">
            <Mail aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input id="recovery-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 w-full rounded-md border border-rule bg-white px-4 pl-11 text-base text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-brand-600/60 focus:ring-4 focus:ring-brand-600/10 sm:text-sm" autoComplete="email" autoCapitalize="none" inputMode="email" placeholder="nom@domaine.com" required />
          </span>
        </label>

        {error ? <p role="alert" className="rounded-md border border-brand-200 bg-paper px-4 py-3 text-sm leading-6 text-brand-700">{error}</p> : null}

        <button type="submit" disabled={loading} className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-sm bg-night-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? "Envoi en cours…" : "Recevoir le lien"}
          {!loading ? <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" /> : null}
        </button>

        <Link href={withNextPath("/login", safeNextPath)} className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Retour à la connexion
        </Link>
      </div>
    </form>
  );
}
