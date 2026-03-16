"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    if (!data.session) {
      setError("Connexion impossible: session non creee.");
      return;
    }

    window.location.assign("/dashboard");
  }

  return (
    <form onSubmit={onSubmit} className="surface-panel space-y-5 p-7 sm:p-8">
      <div className="space-y-3">
        <p className="premium-badge">Connexion</p>
        <h1 className="section-title text-3xl">Accedez a votre espace</h1>
        <p className="text-sm leading-7 text-slate-500">Lecteur, auteur ou admin: retrouvez votre compte, votre bibliotheque et vos actions en cours.</p>
      </div>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="ios-input w-full px-4 py-3.5"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="ios-input w-full px-4 py-3.5"
        required
      />
      {error && <p className="rounded-[1.25rem] bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      <button disabled={loading} className="cta-primary w-full px-4 py-3.5 text-sm disabled:opacity-60">
        {loading ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}
