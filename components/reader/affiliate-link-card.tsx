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
    <article className="rounded-[24px] border border-[#ece3d7] bg-[#fcfaf7] p-4">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-[#171717]">{label}</p>
        <p className="text-sm leading-6 text-[#6f665e]">{description}</p>
      </div>

      <div className="mt-4 rounded-[18px] border border-[#e7ddd1] bg-white px-4 py-3 text-sm text-[#26221d]">
        <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{href}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-[#171717] px-4 text-sm font-semibold text-white transition hover:bg-[#0f172a]"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Lien copie" : "Copier"}
        </button>
        <Link
          href={href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center gap-2 rounded-full border border-[#e7ddd1] bg-white px-4 text-sm font-semibold text-[#26221d] transition hover:border-[#d5c8bb]"
        >
          <ExternalLink className="h-4 w-4" />
          Ouvrir
        </Link>
      </div>
    </article>
  );
}
