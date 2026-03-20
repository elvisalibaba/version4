"use client";

import { useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { getSupabaseBrowserConfigErrorMessage, getSupabaseBrowserErrorMessage } from "@/lib/supabase/browser-errors";
import { createClient } from "@/lib/supabase/client";

const inputClassName =
  "h-12 w-full rounded-2xl border border-[#e7ddd1] bg-white px-4 text-sm text-[#171717] outline-none transition placeholder:text-[#9a8f84] focus:border-[#ff7a5c]/45 focus:ring-4 focus:ring-[#ff7a5c]/10";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
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
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setError(getSupabaseBrowserErrorMessage(signInError, "la connexion"));
        return;
      }

      if (!data.session) {
        setError("Connexion impossible: session non creee.");
        return;
      }

      window.location.assign("/dashboard");
    } catch (signInError) {
      setError(getSupabaseBrowserErrorMessage(signInError, "la connexion"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-5 rounded-[32px] border border-[#e7ddd1] bg-white/95 p-5 shadow-[0_28px_70px_rgba(15,23,42,0.08)] sm:p-8"
    >
      <div className="space-y-3">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#fff1ea] px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#a85b3f]">
          <ShieldCheck className="h-3.5 w-3.5" />
          Connexion securisee
        </span>
        <div className="space-y-2">
          <h1 className="text-[1.9rem] font-semibold tracking-[-0.04em] text-[#171717] sm:text-[2.2rem]">
            Retrouvez votre espace lecteur, auteur ou admin.
          </h1>
          <p className="text-sm leading-7 text-[#6f665e]">
            Bibliotheque, studio auteur, commandes et administration restent accessibles dans une interface plus lisible et plus compacte.
          </p>
        </div>
      </div>

      <label className="grid gap-2">
        <span className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#7d7267]">Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClassName}
          autoComplete="email"
          placeholder="nom@domaine.com"
          required
        />
      </label>

      <label className="grid gap-2">
        <span className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#7d7267]">Mot de passe</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClassName}
          autoComplete="current-password"
          placeholder="Votre mot de passe"
          required
        />
      </label>

      <div className="rounded-[24px] border border-[#efe6dc] bg-[#fcfaf7] p-4 text-sm leading-7 text-[#5d554d]">
        Acces direct aux espaces <span className="font-semibold text-[#171717]">Lecteur</span>, <span className="font-semibold text-[#171717]">Auteur</span> et{" "}
        <span className="font-semibold text-[#171717]">Admin</span> a partir du meme compte.
      </div>

      {error ? (
        <p className="rounded-[22px] border border-[#f4c6bb] bg-[#fff1ed] px-4 py-3 text-sm text-[#9f4a37]">{error}</p>
      ) : null}

      <button
        disabled={loading}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#171717] px-4 text-sm font-semibold text-white transition hover:bg-[#0f172a] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Connexion..." : "Acceder a mon espace"}
        {!loading ? <ArrowRight className="h-4 w-4" /> : null}
      </button>
    </form>
  );
}
