"use client";

import { useState, type FormEvent } from "react";
import { Check, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { getSafeNextPath } from "@/lib/safe-next-path";
import { useRouter } from "next/navigation";

type ResetPasswordFormProps = {
  nextPath: string;
  token: string;
  email: string;
};

function SecurePasswordInput({
  id,
  label,
  value,
  visible,
  onChange,
  onToggle,
}: {
  id: string;
  label: string;
  value: string;
  visible: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <label htmlFor={id} className="grid gap-2">
      <span className="text-[0.7rem] font-bold text-slate-600">{label}</span>
      <span className="relative">
        <KeyRound aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full rounded-md border border-rule bg-white px-11 pr-12 text-base text-slate-900 outline-none transition focus:border-brand-600/60 focus:ring-4 focus:ring-brand-600/10 sm:text-sm"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-slate-600 transition hover:bg-paper-deep hover:text-slate-900"
          aria-label={visible ? `Masquer ${label.toLowerCase()}` : `Afficher ${label.toLowerCase()}`}
          aria-pressed={visible}
        >
          {visible ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
        </button>
      </span>
    </label>
  );
}

export function ResetPasswordForm({ nextPath, token, email }: ResetPasswordFormProps) {
  const router = useRouter();
  const safeNextPath = getSafeNextPath(nextPath);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (password !== confirmation) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          token,
          email,
          password,
          password_confirmation: confirmation,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const firstValidationError = payload?.errors
          ? Object.values(payload.errors).flat().find((value) => typeof value === "string")
          : null;
        setError((firstValidationError as string | null) ?? payload?.message ?? "Le lien est invalide ou à expiré.");
        return;
      }

      const loginUrl = new URL("/login", window.location.origin);
      loginUrl.searchParams.set("reset", "success");
      loginUrl.searchParams.set("next", safeNextPath);
      router.replace(`${loginUrl.pathname}${loginUrl.search}`);
      router.refresh();
    } catch {
      setError("Le service de réinitialisation est momentanément indisponible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} aria-busy={loading} className="relative mx-auto w-full overflow-hidden rounded-md border border-rule bg-paper p-4 sm:rounded-md sm:p-9 lg:p-10">
      <div className="relative grid gap-5 sm:gap-7">
        <header className="space-y-3">
          <span className="inline-flex w-fit items-center gap-2 rounded-sm border border-rule bg-white px-3 py-1.5 text-xs font-bold text-brand-600">
            <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
            Nouveau mot de passe
          </span>
          <div className="space-y-2">
            <h1 className="text-[1.9rem] font-semibold leading-[1.08] tracking-[-0.04em] text-slate-900 sm:text-[2.6rem]">Sécuriser mon compte</h1>
            <p className="text-sm leading-6 text-slate-600">Choisissez un nouveau mot de passe pour retrouver votre espace Holistique Books.</p>
          </div>
        </header>

        <div className="grid gap-4">
          <SecurePasswordInput id="new-password" label="Nouveau mot de passe" value={password} visible={passwordVisible} onChange={setPassword} onToggle={() => setPasswordVisible((visible) => !visible)} />
          <SecurePasswordInput id="new-password-confirmation" label="Confirmer le mot de passe" value={confirmation} visible={confirmationVisible} onChange={setConfirmation} onToggle={() => setConfirmationVisible((visible) => !visible)} />
          <p className="flex items-start gap-2 text-xs leading-5 text-slate-600">
            <Check aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
            Utilisez au moins 8 caractères. Le lien reçu par e-mail est valable pour une durée limitée.
          </p>
        </div>

        {error ? <p role="alert" className="rounded-md border border-brand-200 bg-paper px-4 py-3 text-sm leading-6 text-brand-700">{error}</p> : null}

        <button type="submit" disabled={loading} className="inline-flex h-12 w-full items-center justify-center rounded-sm bg-night-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? "Mise à jour…" : "Enregistrer le mot de passe"}
        </button>
      </div>
    </form>
  );
}
