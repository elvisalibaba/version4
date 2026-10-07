"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink } from "lucide-react";

type AffiliateLinkCardProps = {
  label: string;
  description: string;
  href: string;
};

export function AffiliateLinkCard({ label, description, href }: AffiliateLinkCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className="rounded-[24px] border border-rule bg-paper p-4">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="text-sm leading-6 text-slate-600">{description}</p>
      </div>

      <div className="mt-4 rounded-[18px] border border-rule bg-white px-4 py-3 text-sm text-slate-900">
        <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{href}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex h-11 items-center gap-2 rounded-sm bg-night-900 px-4 text-sm font-semibold text-white transition hover:bg-night-800"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Lien copie" : "Copier"}
        </button>
        <Link
          href={href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center gap-2 rounded-sm border border-rule bg-white px-4 text-sm font-semibold text-slate-900 transition hover:border-rule-strong"
        >
          <ExternalLink className="h-4 w-4" />
          Ouvrir
        </Link>
      </div>
    </article>
  );
}
