"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { getSafeNextPath, withNextPath } from "@/lib/safe-next-path";

const inputClassName =
  "h-13 w-full rounded-md border border-rule-strong bg-white px-4 pl-11 text-base text-night-900 outline-none transition placeholder:text-slate-500 focus:border-night-900 focus:ring-4 focus:ring-night-900/10 sm:text-sm";

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


    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: email.trim(), password, device_name: "web" }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        if (payload?.verification_required && payload?.email) {
          const params = new URLSearchParams({ email: payload.email, next: safeNextPath });
          window.location.assign(`/verify-email?${params.toString()}`);
          return;
        }

        const message =
          payload?.errors?.email?.[0] ??
          payload?.message ??
          "Connexion impossible. Vérifiez vos identifiants.";
        setError(message);
        return;
      }

      window.location.assign(safeNextPath);
    } catch {
      setError("Le service de connexion est momentanément indisponible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      aria-busy={loading}
      className="relative mx-auto w-full max-w-lg overflow-hidden rounded-md bg-paper p-3 sm:p-6 lg:p-0"
    >

      <div className="relative grid gap-5 sm:gap-7">
        <header className="space-y-3">
          <span className="inline-flex w-fit items-center gap-2 rounded-sm border border-rule-strong bg-white px-3 py-1.5 text-xs font-bold text-brand-600">
            <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
            Connexion sécurisée
          </span>
          <div className="space-y-2">
            <h1 className="text-[2.2rem] font-semibold leading-[1.08] tracking-[-0.04em] text-night-900 sm:text-[3rem]">
              Heureux de vous revoir.
            </h1>
            <p className="text-sm leading-6 text-slate-600">
              Connectez-vous pour retrouver votre bibliothèque ou poursuivre votre projet éditorial.
            </p>
          </div>
        </header>

        {notice ? (
          <p
            role={notice.tone === "error" ? "alert" : "status"}
            className={
              notice.tone === "error"
                ? "rounded-md border border-brand-200 bg-paper px-4 py-3 text-sm leading-6 text-brand-700"
                : "rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-night-900"
            }
          >
            {notice.text}
          </p>
        ) : null}

        <div className="grid gap-4">
          <label className="grid gap-2" htmlFor="login-email">
            <span className="text-[0.7rem] font-bold text-slate-600">Adresse email</span>
            <span className="relative">
              <Mail aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
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
              <span className="text-[0.7rem] font-bold text-slate-600">Mot de passe</span>
              <Link href={withNextPath("/forgot-password", safeNextPath)} className="text-xs font-semibold text-brand-600 hover:text-night-900">
                Mot de passe oublié ?
              </Link>
            </span>
            <span className="relative">
              <LockKeyhole aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
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
                className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-slate-600 transition hover:bg-paper-deep hover:text-night-900"
                aria-label={passwordVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                aria-pressed={passwordVisible}
              >
                {passwordVisible ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
              </button>
            </span>
          </label>
        </div>

        {error ? (
          <p role="alert" className="rounded-md border border-brand-200 bg-paper px-4 py-3 text-sm leading-6 text-brand-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="group inline-flex h-13 w-full items-center justify-center gap-2 rounded-sm bg-night-900 px-6 text-sm font-bold text-white transition hover:bg-night-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Connexion en cours…" : "Accéder à mon espace"}
          {!loading ? <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" /> : null}
        </button>
      </div>
    </form>
  );
}
