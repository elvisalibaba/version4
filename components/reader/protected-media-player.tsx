"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Clapperboard, Headphones, LoaderCircle, LockKeyhole, Play, RefreshCw } from "lucide-react";

type MediaAccess = {
  id: string;
  book_id: string;
  media_type: "audiobook" | "video" | "ebook" | "print" | "bundle";
  title: string | null;
  language: string;
  duration_seconds: number | null;
  narrator: string | null;
  presenter: string | null;
  playback_url: string | null;
  preview_url: string | null;
  expires_in_seconds: number | null;
  chapters: Array<{
    id: string;
    position: number;
    title: string;
    starts_at_second: number | null;
    ends_at_second: number | null;
    is_preview: boolean;
  }>;
};

export function ProtectedMediaPlayer({
  editionId,
  mediaType,
  title,
}: {
  editionId: string;
  mediaType: "audiobook" | "video";
  title: string;
}) {
  const [access, setAccess] = useState<MediaAccess | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const mediaRef = useRef<HTMLMediaElement | null>(null);

  const isAudio = mediaType === "audiobook";
  const Icon = isAudio ? Headphones : Clapperboard;

  const loadAccess = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/backend/media-editions/${encodeURIComponent(editionId)}/access`,
        { cache: "no-store", headers: { Accept: "application/json" } },
      );
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message ?? "Ce média n’est pas accessible avec votre compte.");
      }

      const data = payload?.data as MediaAccess | undefined;
      if (!data?.playback_url) {
        throw new Error("Le fichier de lecture n’est pas encore disponible.");
      }

      setAccess(data);
      setStarted(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Lecture indisponible.");
    } finally {
      setLoading(false);
    }
  }, [editionId]);

  useEffect(() => {
    if (!started || !access?.expires_in_seconds) return;
    const refreshAfter = Math.max(60, access.expires_in_seconds - 90) * 1000;
    const timer = window.setTimeout(() => void loadAccess(), refreshAfter);
    return () => window.clearTimeout(timer);
  }, [access?.expires_in_seconds, loadAccess, started]);

  const chapterSummary = useMemo(
    () => access?.chapters?.slice().sort((a, b) => a.position - b.position) ?? [],
    [access?.chapters],
  );

  function seekTo(seconds: number | null) {
    if (seconds === null || !mediaRef.current) return;
    mediaRef.current.currentTime = seconds;
    void mediaRef.current.play().catch(() => undefined);
  }

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4">
      {!started ? (
        <button
          type="button"
          onClick={() => void loadAccess()}
          disabled={loading}
          className="flex w-full items-center justify-between gap-4 rounded-[20px] bg-night-900 p-4 text-left text-white transition hover:bg-night-800 disabled:opacity-60"
        >
          <span className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10">
              {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
            </span>
            <span>
              <span className="block text-sm font-bold">{loading ? "Préparation de la lecture…" : isAudio ? "Écouter maintenant" : "Regarder maintenant"}</span>
              <span className="mt-1 block text-xs text-white/60">Accès sécurisé depuis votre bibliothèque</span>
            </span>
          </span>
          {!loading ? <Play className="h-5 w-5" /> : null}
        </button>
      ) : null}

      {error ? (
        <div className="rounded-[20px] border border-brand-200 bg-slate-50 p-4 text-sm text-brand-700">
          <div className="flex items-center gap-2 font-bold"><LockKeyhole className="h-4 w-4" /> Lecture indisponible</div>
          <p className="mt-2">{error}</p>
          <button type="button" onClick={() => void loadAccess()} className="mt-3 inline-flex items-center gap-2 font-bold text-night-900">
            <RefreshCw className="h-4 w-4" /> Réessayer
          </button>
        </div>
      ) : null}

      {access?.playback_url ? (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-bold text-night-900">{access.title || title}</p>
          </div>
          {isAudio ? (
            <audio
              ref={(element) => { mediaRef.current = element; }}
              src={access.playback_url}
              controls
              preload="metadata"
              className="w-full"
            />
          ) : (
            <video
              ref={(element) => { mediaRef.current = element; }}
              src={access.playback_url}
              controls
              playsInline
              preload="metadata"
              className="aspect-video w-full rounded-[18px] bg-black"
            />
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="rounded-full bg-slate-100 px-2.5 py-1">{access.language?.toUpperCase() || "FR"}</span>
            {access.narrator ? <span>Narration : {access.narrator}</span> : null}
            {access.presenter ? <span>Présentation : {access.presenter}</span> : null}
          </div>

          {chapterSummary.length ? (
            <div className="border-t border-slate-200 pt-4">
              <p className="text-[0.68rem] font-extrabold uppercase tracking-[.16em] text-brand-600">Chapitres</p>
              <div className="mt-3 grid gap-2">
                {chapterSummary.map((chapter) => (
                  <button
                    key={chapter.id}
                    type="button"
                    onClick={() => seekTo(chapter.starts_at_second)}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm transition hover:border-slate-400"
                  >
                    <span><strong className="mr-2 text-night-900">{chapter.position}.</strong>{chapter.title}</span>
                    {chapter.starts_at_second !== null ? (
                      <span className="shrink-0 text-xs text-slate-500">{Math.floor(chapter.starts_at_second / 60)}:{String(chapter.starts_at_second % 60).padStart(2, "0")}</span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
