"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type EpubRendition = {
  prev: () => void;
  next: () => void;
  destroy: () => void;
  themes: {
    register: (name: string, styles: { body: { background: string; color: string } }) => void;
    select: (name: string) => void;
    fontSize: (size: string) => void;
  };
};

export function ReaderPopup({
  bookId,
  open,
  onClose,
}: {
  bookId: string;
  open: boolean;
  onClose: () => void;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renditionRef = useRef<EpubRendition | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<"epub" | "pdf" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [epubFontSize, setEpubFontSize] = useState(100);
  const [epubTheme, setEpubTheme] = useState<"light" | "sepia" | "dark">("light");

  const isEpub = useMemo(() => fileType === "epub", [fileType]);

  useEffect(() => {
    async function loadSignedUrl() {
      if (!open) return;

      setError(null);
      const res = await fetch(`/api/read/${bookId}`);
      const payload = await res.json();

      if (!res.ok) {
        setError(payload.error ?? "Unable to open book");
        return;
      }

      setFileUrl(payload.readerUrl);
      setFileType(payload.fileType);
    }

    loadSignedUrl();
  }, [bookId, open]);

  useEffect(() => {
    if (!open || !fileUrl || !isEpub || !mountRef.current) return;

    let cancelled = false;

    async function renderEpub() {
      const epub = (await import("epubjs")).default;
      if (cancelled || !mountRef.current) return;

      mountRef.current.innerHTML = "";
      const book = epub(fileUrl);
      const rendition = book.renderTo(mountRef.current, {
        width: "100%",
        height: "100%",
      });

      rendition.themes.register("light", { body: { background: "#ffffff", color: "#0f172a" } });
      rendition.themes.register("sepia", { body: { background: "#f8f1e3", color: "#4b3b2a" } });
      rendition.themes.register("dark", { body: { background: "#111827", color: "#e5e7eb" } });
      rendition.themes.select(epubTheme);
      rendition.themes.fontSize(`${epubFontSize}%`);
      renditionRef.current = rendition;

      await rendition.display();
    }

    renderEpub();

    return () => {
      cancelled = true;
      if (renditionRef.current) {
        renditionRef.current.destroy();
        renditionRef.current = null;
      }
    };
  }, [fileUrl, open, isEpub, epubFontSize, epubTheme]);

  if (!open) return null;

  function openFullScreen() {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    void containerRef.current.requestFullscreen();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4">
      <div ref={containerRef} className="flex h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-3 py-2 sm:px-4 sm:py-3">
          <h3 className="font-semibold">Lecteur securise</h3>
          <div className="flex flex-wrap items-center gap-2">
            {isEpub && (
              <>
                <button
                  onClick={() => renditionRef.current?.prev()}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm"
                >
                  Precedent
                </button>
                <button
                  onClick={() => renditionRef.current?.next()}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm"
                >
                  Suivant
                </button>
                <button
                  onClick={() => setEpubFontSize((prev) => Math.max(80, prev - 10))}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm"
                >
                  A-
                </button>
                <button
                  onClick={() => setEpubFontSize((prev) => Math.min(160, prev + 10))}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm"
                >
                  A+
                </button>
                <select
                  value={epubTheme}
                  onChange={(e) => setEpubTheme(e.target.value as "light" | "sepia" | "dark")}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs sm:text-sm"
                >
                  <option value="light">Clair</option>
                  <option value="sepia">Sepia</option>
                  <option value="dark">Sombre</option>
                </select>
              </>
            )}
            <button onClick={openFullScreen} className="rounded-md border border-slate-300 px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm">
              Plein ecran
            </button>
            <button onClick={onClose} className="rounded-md border border-slate-300 px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm">
              Fermer
            </button>
          </div>
        </div>
        <div className="flex-1 p-2 sm:p-4" onContextMenu={(e) => e.preventDefault()}>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!error && !fileUrl && <p>Chargement du lecteur...</p>}
          {!error && fileUrl && fileType === "pdf" && (
            <iframe
              src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
              title="PDF Reader"
              className="h-full w-full rounded-lg"
            />
          )}
          {!error && fileUrl && fileType === "epub" && <div ref={mountRef} className="h-full w-full rounded-lg" />}
          <p className="mt-2 text-xs text-slate-500">Lecture web securisee. Telechargement direct non expose dans l interface.</p>
        </div>
      </div>
    </div>
  );
}
