"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import {
  getSupabaseBrowserConfigErrorMessage,
  getSupabaseBrowserErrorMessage,
} from "@/lib/supabase/browser-errors";
import { createClient } from "@/lib/supabase/client";
import { getSafeNextPath, withNextPath } from "@/lib/safe-next-path";

const inputClassName =
  "h-13 w-full rounded-2xl border border-[#d9cebd] bg-white px-4 pl-11 text-base text-[#17231d] outline-none transition placeholder:text-[#a79b90] focus:border-[#173d2c] focus:ring-4 focus:ring-[#173d2c]/10 sm:text-sm";

type LoginFormProps = {
  nextPath: string;
  notice?: {
    tone: "error" | "success";
    text: string;
  } | null;
};

export function LoginForm({ nextPath, notice = null }: LoginFormProps) {
  const safeNextPath = getSafeNextPath(nextPath);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(getSupabaseBrowserErrorMessage(signInError, "la connexion"));
        return;
      }

      if (!data.session) {
        setError("Connexion impossible : aucune session n’a été créée.");
        return;
      }

      window.location.assign(safeNextPath);
    } catch (signInError) {
      setError(getSupabaseBrowserErrorMessage(signInError, "la connexion"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      aria-busy={loading}
      className="relative mx-auto w-full max-w-lg overflow-hidden rounded-[24px] bg-[#fffaf2] p-3 sm:p-6 lg:p-0"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#e8ac42]/15 blur-3xl" />

      <div className="relative grid gap-5 sm:gap-7">
        <header className="space-y-3">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d9cebd] bg-white px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.24em] text-[#a94b34]">
            <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
            Connexion sécurisée
          </span>
          <div className="space-y-2">
            <h1 className="font-serif text-[2.2rem] font-semibold leading-[1.08] tracking-[-0.04em] text-[#17231d] sm:text-[3rem]">
              Heureux de vous revoir.
            </h1>
            <p className="text-sm leading-6 text-[#6f665e]">
              Connectez-vous pour retrouver votre bibliothèque ou poursuivre votre projet éditorial.
            </p>
          </div>
        </header>

        {notice ? (
          <p
            role={notice.tone === "error" ? "alert" : "status"}
            className={
              notice.tone === "error"
                ? "rounded-2xl border border-[#f2b9aa] bg-[#fff0eb] px-4 py-3 text-sm leading-6 text-[#8f3f2e]"
                : "rounded-2xl border border-[#b9ddcb] bg-[#effaf4] px-4 py-3 text-sm leading-6 text-[#266347]"
            }
          >
            {notice.text}
          </p>
        ) : null}

        <div className="grid gap-4">
          <label className="grid gap-2" htmlFor="login-email">
            <span className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#6f665e]">Adresse email</span>
            <span className="relative">
              <Mail aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#aa9c91]" />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClassName}
                autoComplete="email"
                autoCapitalize="none"
                inputMode="email"
                placeholder="nom@domaine.com"
                required
              />
            </span>
          </label>

          <label className="grid gap-2" htmlFor="login-password">
            <span className="flex items-center justify-between gap-3">
              <span className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#6f665e]">Mot de passe</span>
              <Link href={withNextPath("/forgot-password", safeNextPath)} className="text-xs font-semibold text-[#a94b34] hover:text-[#173d2c]">
                Mot de passe oublié ?
              </Link>
            </span>
            <span className="relative">
              <LockKeyhole aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#aa9c91]" />
              <input
                id="login-password"
                type={passwordVisible ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={`${inputClassName} pr-12`}
                autoComplete="current-password"
                placeholder="Votre mot de passe"
                required
              />
              <button
                type="button"
                onClick={() => setPasswordVisible((visible) => !visible)}
                className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-[#71675f] transition hover:bg-[#f1e8da] hover:text-[#173d2c]"
                aria-label={passwordVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                aria-pressed={passwordVisible}
              >
                {passwordVisible ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
              </button>
            </span>
          </label>
        </div>

        {error ? (
          <p role="alert" className="rounded-2xl border border-[#f2b9aa] bg-[#fff0eb] px-4 py-3 text-sm leading-6 text-[#8f3f2e]">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="group inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-[#173d2c] px-6 text-sm font-bold text-white shadow-[0_16px_35px_rgba(23,61,44,0.18)] transition hover:bg-[#23573f] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Connexion en cours…" : "Accéder à mon espace"}
          {!loading ? <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" /> : null}
        </button>
      </div>
    </form>
  );
}
