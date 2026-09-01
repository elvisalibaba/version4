"use client";

import { useState, type FormEvent } from "react";
import { Check, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { getSafeNextPath } from "@/lib/safe-next-path";
import { getSupabaseBrowserErrorMessage } from "@/lib/supabase/browser-errors";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type ResetPasswordFormProps = {
  nextPath: string;
};

function SecurePasswordInput({ id, label, value, visible, onChange, onToggle }: {
  id: string;
  label: string;
  value: string;
  visible: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <label htmlFor={id} className="grid gap-2">
      <span className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#6f665e]">{label}</span>
      <span className="relative">
        <KeyRound aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#aa9c91]" />
        <input id={id} type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} className="h-12 w-full rounded-2xl border border-[#eadfd4] bg-white px-11 pr-12 text-base text-[#171717] outline-none transition focus:border-[#ff7a5c]/60 focus:ring-4 focus:ring-[#ff7a5c]/10 sm:text-sm" autoComplete="new-password" minLength={8} required />
        <button type="button" onClick={onToggle} className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-[#71675f] transition hover:bg-[#f6eee7] hover:text-[#171717]" aria-label={visible ? `Masquer ${label.toLowerCase()}` : `Afficher ${label.toLowerCase()}`} aria-pressed={visible}>
          {visible ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
        </button>
      </span>
    </label>
  );
}

export function ResetPasswordForm({ nextPath }: ResetPasswordFormProps) {
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
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(getSupabaseBrowserErrorMessage(updateError, "la mise à jour du mot de passe"));
        return;
      }

      await supabase.auth.signOut();
      const loginUrl = new URL("/login", window.location.origin);
      loginUrl.searchParams.set("reset", "success");
      loginUrl.searchParams.set("next", safeNextPath);
      router.replace(`${loginUrl.pathname}${loginUrl.search}`);
      router.refresh();
    } catch (updateError) {
      setError(getSupabaseBrowserErrorMessage(updateError, "la mise à jour du mot de passe"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} aria-busy={loading} className="relative mx-auto w-full overflow-hidden rounded-[24px] border border-[#eadfd4] bg-[#fdfaf6] p-4 shadow-[0_20px_60px_rgba(23,23,23,0.08)] sm:rounded-[36px] sm:p-9 lg:p-10">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#ff7a5c]/10 blur-3xl" />
      <div className="relative grid gap-5 sm:gap-7">
        <header className="space-y-3">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#f0dfd3] bg-white px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#9a583f]">
            <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
            Nouveau mot de passe
          </span>
          <div className="space-y-2">
            <h1 className="text-[1.9rem] font-semibold leading-[1.08] tracking-[-0.04em] text-[#171717] sm:text-[2.6rem]">Sécuriser mon compte</h1>
            <p className="text-sm leading-6 text-[#6f665e]">Choisissez un nouveau mot de passe pour retrouver votre espace.</p>
          </div>
        </header>

        <div className="grid gap-4">
          <SecurePasswordInput id="new-password" label="Nouveau mot de passe" value={password} visible={passwordVisible} onChange={setPassword} onToggle={() => setPasswordVisible((visible) => !visible)} />
          <SecurePasswordInput id="new-password-confirmation" label="Confirmer le mot de passe" value={confirmation} visible={confirmationVisible} onChange={setConfirmation} onToggle={() => setConfirmationVisible((visible) => !visible)} />
          <p className="flex items-start gap-2 text-xs leading-5 text-[#7d7268]"><Check aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#b5533d]" />Utilisez au moins 8 caractères et conservez ce mot de passe dans un endroit sûr.</p>
        </div>

        {error ? <p role="alert" className="rounded-2xl border border-[#f2b9aa] bg-[#fff0eb] px-4 py-3 text-sm leading-6 text-[#8f3f2e]">{error}</p> : null}

        <button type="submit" disabled={loading} className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#171717] px-6 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(23,23,23,0.18)] transition hover:bg-[#332c27] disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? "Mise à jour…" : "Enregistrer le mot de passe"}
        </button>
      </div>
    </form>
  );
}
