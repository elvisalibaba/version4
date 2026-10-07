"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";

type AdPayload = {
  assignment_id: string;
  placement: {
    code: string;
    surface: string;
    position: string | null;
    width: number | null;
    height: number | null;
  };
  campaign: {
    id: string;
    name: string;
    advertiser: string;
  };
  creative: {
    id: string;
    type: "banner" | "image" | "video" | "native";
    headline: string | null;
    body: string | null;
    asset_url: string | null;
    click_url: string | null;
    cta_label: string | null;
    alt_text: string | null;
  };
};

function adSession() {
  if (typeof window === "undefined") return null;
  const key = "hb_ad_session";
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const value = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.sessionStorage.setItem(key, value);
  return value;
}

export function AdSlot({
  placementCode,
  className = "",
}: {
  placementCode: string;
  className?: string;
}) {
  const [ad, setAd] = useState<AdPayload | null>(null);
  const tracked = useRef<string | null>(null);
  const endpoint = useMemo(
    () => `/api/backend/ads/${encodeURIComponent(placementCode)}?channel=web`,
    [placementCode],
  );

  useEffect(() => {
    let cancelled = false;

    const target = new URL(endpoint, window.location.origin);
    const session = adSession();
    if (session) target.searchParams.set("session", session);

    void fetch(target.toString(), { cache: "no-store", headers: { Accept: "application/json" } })
      .then(async (response) => {
        if (!response.ok) return null;
        const payload = (await response.json()) as { data?: AdPayload | null };
        return payload.data ?? null;
      })
      .then((value) => {
        if (!cancelled) setAd(value);
      })
      .catch(() => {
        if (!cancelled) setAd(null);
      });

    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  useEffect(() => {
    if (!ad || tracked.current === ad.assignment_id) return;
    tracked.current = ad.assignment_id;

    void fetch(`/api/backend/ads/${encodeURIComponent(ad.assignment_id)}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        event_type: "impression",
        session: adSession(),
        context: { placement: placementCode, channel: "web" },
      }),
    }).catch(() => undefined);
  }, [ad, placementCode]);

  if (!ad) return null;

  async function trackClick() {
    if (!ad) return;
    await fetch(`/api/backend/ads/${encodeURIComponent(ad.assignment_id)}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        event_type: "click",
        session: adSession(),
        context: { placement: placementCode, channel: "web" },
      }),
    }).catch(() => undefined);
  }

  const content = (
    <article className={`group relative overflow-hidden rounded-xl border border-slate-300 bg-white shadow-md ${className}`}>
      <span className="absolute right-3 top-3 z-10 rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold text-white">
        Sponsorisé
      </span>
      <div className="grid md:grid-cols-[minmax(0,0.9fr)_minmax(280px,1.1fr)] md:items-stretch">
        {ad.creative.asset_url ? (
          ad.creative.type === "video" ? (
            <video src={ad.creative.asset_url} muted playsInline preload="metadata" className="h-full min-h-44 w-full object-cover" />
          ) : (
            // Dynamic advertiser hosts cannot all be declared in next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ad.creative.asset_url} alt={ad.creative.alt_text ?? ad.creative.headline ?? "Publicité"} className="h-full min-h-44 w-full object-cover" />
          )
        ) : (
          <div className="min-h-44 bg-night-900" />
        )}
        <div className="flex flex-col justify-center p-5 sm:p-7">
          <p className="text-xs font-extrabold text-brand-600">{ad.campaign.advertiser}</p>
          {ad.creative.headline ? <h3 className="mt-2 font-display text-2xl font-extrabold tracking-[-0.035em] text-slate-900">{ad.creative.headline}</h3> : null}
          {ad.creative.body ? <p className="mt-2 text-sm leading-6 text-slate-600">{ad.creative.body}</p> : null}
          {ad.creative.cta_label ? <span className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-night-900">{ad.creative.cta_label}<ExternalLink className="h-4 w-4" /></span> : null}
        </div>
      </div>
    </article>
  );

  if (!ad.creative.click_url) return content;

  return (
    <a href={ad.creative.click_url} target="_blank" rel="sponsored noopener noreferrer" onClick={() => void trackClick()} className="block">
      {content}
    </a>
  );
}
