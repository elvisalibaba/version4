"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

/** Partage natif sur mobile, copie du lien ailleurs. */
export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href.split("?")[0];
    try {
      if (navigator.share) {
        await navigator.share({ title, text: `${title} — à lire sur Holistique Books`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Partage annulé par l'utilisateur.
    }
  }

  return (
    <button type="button" onClick={share} className="inline-flex h-10 items-center gap-2 rounded-sm border border-rule-strong bg-white px-3.5 text-sm font-semibold text-night-900 transition hover:border-night-900">
      {copied ? <Check aria-hidden="true" className="hb-check-pop h-4 w-4 text-emerald-700" /> : <Share2 aria-hidden="true" className="h-4 w-4" />}
      {copied ? "Lien copié" : "Partager"}
    </button>
  );
}
