"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

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
    <form onSubmit={onSubmit} className="ios-surface-strong space-y-4 rounded-[2rem] p-6">
      <div className="space-y-2">
        <p className="ios-kicker">Connexion</p>
        <h1 className="ios-title text-2xl font-bold">Accedez a votre espace</h1>
      </div>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="ios-input w-full rounded-2xl px-4 py-3"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="ios-input w-full rounded-2xl px-4 py-3"
        required
      />
      {error && <p className="ios-danger rounded-2xl px-4 py-3 text-sm">{error}</p>}
      <button disabled={loading} className="ios-button-primary w-full rounded-2xl px-4 py-3 font-semibold disabled:opacity-60">
        {loading ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}
