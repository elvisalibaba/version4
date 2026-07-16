"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Mail, MailCheck, ShieldCheck } from "lucide-react";
import { getSafeNextPath, withNextPath } from "@/lib/safe-next-path";
import {
  getSupabaseBrowserConfigErrorMessage,
  getSupabaseBrowserErrorMessage,
} from "@/lib/supabase/browser-errors";
import { createClient } from "@/lib/supabase/client";

type ForgotPasswordFormProps = {
  nextPath: string;
};

export function ForgotPasswordForm({ nextPath }: ForgotPasswordFormProps) {
  const safeNextPath = getSafeNextPath(nextPath);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function getRecoveryRedirectTo() {
    const resetPath = withNextPath("/reset-password", safeNextPath);
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", resetPath);
    return callbackUrl.toString();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const configError = getSupabaseBrowserConfigErrorMessage();
    if (configError) {
      setError(configError);
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: getRecoveryRedirectTo(),
      });

      if (recoveryError) {
        setError(getSupabaseBrowserErrorMessage(recoveryError, "la récupération du mot de passe"));
        return;
      }

      setSent(true);
    } catch (recoveryError) {
      setError(getSupabaseBrowserErrorMessage(recoveryError, "la récupération du mot de passe"));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <section className="mx-auto w-full max-w-lg rounded-[24px] border border-[#eadfd4] bg-[#fdfaf6] p-5 text-center shadow-[0_20px_60px_rgba(23,23,23,0.08)] sm:rounded-[36px] sm:p-10" aria-labelledby="recovery-sent-title">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#fff0e9] text-[#b5533d]">
          <MailCheck aria-hidden="true" className="h-6 w-6" />
        </span>
        <h1 id="recovery-sent-title" className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-[#171717]">Consultez votre email</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#6f665e]">
          Si un compte correspond à <strong className="text-[#171717]">{email}</strong>, un lien de réinitialisation vient d’être envoyé.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => setSent(false)} className="inline-flex h-11 items-center justify-center rounded-full border border-[#d9c9bc] bg-white px-4 text-sm font-semibold text-[#171717] hover:bg-[#f8f1eb]">
            Modifier l’adresse
          </button>
          <Link href={withNextPath("/login", safeNextPath)} className="inline-flex h-11 items-center justify-center rounded-full bg-[#171717] px-4 text-sm font-semibold text-white hover:bg-[#332c27]">
            Retour à la connexion
          </Link>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={onSubmit} aria-busy={loading} className="relative mx-auto w-full max-w-lg overflow-hidden rounded-[24px] border border-[#eadfd4] bg-[#fdfaf6] p-4 shadow-[0_20px_60px_rgba(23,23,23,0.08)] sm:rounded-[36px] sm:p-9 lg:p-10">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#ff7a5c]/10 blur-3xl" />
      <div className="relative grid gap-5 sm:gap-7">
        <header className="space-y-3">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#f0dfd3] bg-white px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#9a583f]">
            <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
            Récupération sécurisée
          </span>
          <div className="space-y-2">
            <h1 className="text-[1.9rem] font-semibold leading-[1.08] tracking-[-0.04em] text-[#171717] sm:text-[2.6rem]">Mot de passe oublié ?</h1>
            <p className="text-sm leading-6 text-[#6f665e]">Indiquez l’adresse liée à votre compte. Nous vous enverrons un lien à usage limité.</p>
          </div>
        </header>

        <label className="grid gap-2" htmlFor="recovery-email">
          <span className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#6f665e]">Adresse email</span>
          <span className="relative">
            <Mail aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#aa9c91]" />
            <input id="recovery-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 w-full rounded-2xl border border-[#eadfd4] bg-white px-4 pl-11 text-base text-[#171717] outline-none transition placeholder:text-[#a79b90] focus:border-[#ff7a5c]/60 focus:ring-4 focus:ring-[#ff7a5c]/10 sm:text-sm" autoComplete="email" autoCapitalize="none" inputMode="email" placeholder="nom@domaine.com" required />
          </span>
        </label>

        {error ? <p role="alert" className="rounded-2xl border border-[#f2b9aa] bg-[#fff0eb] px-4 py-3 text-sm leading-6 text-[#8f3f2e]">{error}</p> : null}

        <button type="submit" disabled={loading} className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#171717] px-6 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(23,23,23,0.18)] transition hover:bg-[#332c27] disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? "Envoi en cours…" : "Recevoir le lien"}
          {!loading ? <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" /> : null}
        </button>

        <Link href={withNextPath("/login", safeNextPath)} className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-[#6f665e] hover:text-[#171717]">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Retour à la connexion
        </Link>
      </div>
    </form>
  );
}
