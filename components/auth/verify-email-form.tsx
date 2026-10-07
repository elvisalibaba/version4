"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, MailCheck, RefreshCw, ShieldCheck } from "lucide-react";
import { getSafeNextPath, withNextPath } from "@/lib/safe-next-path";

type VerifyEmailFormProps = {
  email: string;
  nextPath: string;
};

export function VerifyEmailForm({ email, nextPath }: VerifyEmailFormProps) {
  const safeNextPath = getSafeNextPath(nextPath);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const maskedEmail = useMemo(() => {
    const [name, domain] = email.split("@");
    if (!name || !domain) return email;
    return `${name.slice(0, 2)}${"*".repeat(Math.max(2, name.length - 2))}@${domain}`;
  }, [email]);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, code: code.replace(/\D/g, ""), device_name: "web" }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const firstError = payload?.errors?.code?.[0] ?? payload?.errors?.email?.[0] ?? payload?.message;
        setError(firstError ?? "Code invalide.");
        return;
      }

      setMessage("Adresse confirmée. Ouverture de votre espace…");
      window.location.assign(safeNextPath);
    } catch {
      setError("Le service de vérification est momentanément indisponible.");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setResending(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(payload?.message ?? "Impossible de renvoyer le code.");
        return;
      }
      setMessage("Un nouveau code vient d’être envoyé.");
    } catch {
      setError("Le renvoi est momentanément indisponible.");
    } finally {
      setResending(false);
    }
  }

  return (
    <form onSubmit={verify} className="mx-auto w-full max-w-lg rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-md sm:p-9">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-night-900 text-white">
        <MailCheck className="h-6 w-6" />
      </span>
      <div className="mt-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-brand-600">
          <ShieldCheck className="h-3.5 w-3.5" />
          Vérification email
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-night-900 sm:text-4xl">
          Confirmez votre adresse.
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Nous avons envoyé un code à <strong className="text-night-900">{maskedEmail}</strong>. Il reste valable 15 minutes.
        </p>
      </div>

      <label className="mt-6 grid gap-2" htmlFor="verification-code">
        <span className="text-[0.7rem] font-bold text-slate-600">Code à 6 chiffres</span>
        <input
          id="verification-code"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          className="h-16 rounded-2xl border border-slate-300 bg-white px-4 text-center text-2xl font-bold tracking-[0.5em] text-night-900 outline-none focus:border-night-900 focus:ring-4 focus:ring-night-900/10"
          placeholder="000000"
          required
        />
      </label>

      {error ? <p role="alert" className="mt-4 rounded-2xl border border-brand-200 bg-slate-50 px-4 py-3 text-sm text-brand-700">{error}</p> : null}
      {message ? <p role="status" className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-night-900"><CheckCircle2 className="h-4 w-4" />{message}</p> : null}

      <button type="submit" disabled={loading || code.length !== 6} className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-night-900 px-6 text-sm font-bold text-white disabled:opacity-50">
        {loading ? "Vérification…" : "Valider mon compte"}
      </button>

      <button type="button" onClick={resend} disabled={resending} className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-night-900 disabled:opacity-50">
        <RefreshCw className={`h-4 w-4 ${resending ? "animate-spin" : ""}`} />
        {resending ? "Renvoi…" : "Renvoyer le code"}
      </button>

      <p className="mt-5 text-center text-xs text-slate-600">
        Mauvaise adresse ?{" "}
        <Link href={withNextPath("/register", safeNextPath)} className="font-bold text-brand-600 underline underline-offset-4">
          Recommencer l’inscription
        </Link>
      </p>
    </form>
  );
}
