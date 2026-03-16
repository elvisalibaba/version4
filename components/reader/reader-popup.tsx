"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PdfReaderSurface } from "@/components/reader/pdf-reader-surface";

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

const READER_FETCH_HEADERS = {
  "X-Holistique-Reader": "web",
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
  const [pdfPageNumber, setPdfPageNumber] = useState(1);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [pdfScale, setPdfScale] = useState(1.15);

  const isEpub = useMemo(() => fileType === "epub", [fileType]);
  const isPdf = useMemo(() => fileType === "pdf", [fileType]);

  useEffect(() => {
    async function loadSignedUrl() {
      if (!open) return;

      setError(null);
      setFileUrl(null);
      setFileType(null);
      try {
        const res = await fetch(`/api/read/${bookId}`);
        const payload = await res.json();

        if (!res.ok) {
          setError(payload.error ?? "Impossible d ouvrir ce livre.");
          return;
        }

        setFileUrl(payload.readerUrl);
        setFileType(payload.fileType);
      } catch {
        setError("Le lecteur securise ne repond pas pour le moment.");
      }
    }

    loadSignedUrl();
  }, [bookId, open]);

  useEffect(() => {
    if (!open) return;
    setPdfPageNumber(1);
    setPdfPageCount(0);
    setPdfScale(1.15);
  }, [bookId, fileType, open]);

  useEffect(() => {
    if (pdfPageCount > 0 && pdfPageNumber > pdfPageCount) {
      setPdfPageNumber(pdfPageCount);
    }
  }, [pdfPageCount, pdfPageNumber]);

  useEffect(() => {
    if (!open || !fileUrl || !isEpub || !mountRef.current) return;

    let cancelled = false;
    const readerUrl = fileUrl;

    async function renderEpub() {
      const [epub, response] = await Promise.all([
        import("epubjs"),
        fetch(readerUrl, {
          headers: READER_FETCH_HEADERS,
          cache: "no-store",
          credentials: "same-origin",
        }),
      ]);

      if (!response.ok) {
        throw new Error("Impossible de charger ce livre dans le lecteur securise.");
      }

      if (cancelled || !mountRef.current) return;
      const currentFile = await response.arrayBuffer();

      mountRef.current.innerHTML = "";
      const book = epub.default(currentFile);
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

    renderEpub().catch((nextError) => {
      if (!cancelled) {
        setError(nextError instanceof Error ? nextError.message : "Lecture EPUB indisponible.");
      }
    });

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
    <div className="reader-modal fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div ref={containerRef} className="reader-window flex h-[96vh] w-full max-w-6xl flex-col overflow-hidden">
        <div className="reader-toolbar flex flex-wrap items-center justify-between gap-2 px-3 py-3 sm:px-4 sm:py-3.5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-500">Secure reader</p>
            <h3 className="mt-1 font-semibold text-slate-950">Lecteur web</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isEpub && (
              <>
                <button
                  onClick={() => renditionRef.current?.prev()}
                  className="cta-secondary px-3 py-2 text-xs sm:text-sm"
                >
                  Precedent
                </button>
                <button
                  onClick={() => renditionRef.current?.next()}
                  className="cta-secondary px-3 py-2 text-xs sm:text-sm"
                >
                  Suivant
                </button>
                <button
                  onClick={() => setEpubFontSize((prev) => Math.max(80, prev - 10))}
                  className="cta-secondary px-3 py-2 text-xs sm:text-sm"
                >
                  A-
                </button>
                <button
                  onClick={() => setEpubFontSize((prev) => Math.min(160, prev + 10))}
                  className="cta-secondary px-3 py-2 text-xs sm:text-sm"
                >
                  A+
                </button>
                <select
                  value={epubTheme}
                  onChange={(e) => setEpubTheme(e.target.value as "light" | "sepia" | "dark")}
                  className="rounded-full border border-violet-200 bg-white px-3 py-2 text-xs sm:text-sm"
                >
                  <option value="light">Clair</option>
                  <option value="sepia">Sepia</option>
                  <option value="dark">Sombre</option>
                </select>
              </>
            )}
            {isPdf && (
              <>
                <button
                  onClick={() => setPdfPageNumber((prev) => Math.max(1, prev - 1))}
                  className="cta-secondary px-3 py-2 text-xs sm:text-sm"
                >
                  Page precedente
                </button>
                <button
                  onClick={() => setPdfPageNumber((prev) => Math.min(pdfPageCount || prev + 1, prev + 1))}
                  className="cta-secondary px-3 py-2 text-xs sm:text-sm"
                >
                  Page suivante
                </button>
                <button
                  onClick={() => setPdfScale((prev) => Math.max(0.85, Number((prev - 0.1).toFixed(2))))}
                  className="cta-secondary px-3 py-2 text-xs sm:text-sm"
                >
                  Zoom -
                </button>
                <button
                  onClick={() => setPdfScale((prev) => Math.min(2, Number((prev + 0.1).toFixed(2))))}
                  className="cta-secondary px-3 py-2 text-xs sm:text-sm"
                >
                  Zoom +
                </button>
                <span className="rounded-full border border-violet-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 sm:text-sm">
                  Page {pdfPageNumber}{pdfPageCount > 0 ? ` / ${pdfPageCount}` : ""}
                </span>
              </>
            )}
            <button onClick={openFullScreen} className="cta-secondary px-3 py-2 text-xs sm:text-sm">
              Plein ecran
            </button>
            <button onClick={onClose} className="cta-primary px-3 py-2 text-xs sm:text-sm">
              Fermer
            </button>
          </div>
        </div>
        <div className="flex-1 p-2 sm:p-4" onContextMenu={(e) => e.preventDefault()}>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!error && !fileUrl && <p>Chargement du lecteur...</p>}
          {!error && fileUrl && fileType === "pdf" && (
            <PdfReaderSurface
              fileUrl={fileUrl}
              pageNumber={pdfPageNumber}
              scale={pdfScale}
              onPageCount={setPdfPageCount}
              onError={setError}
            />
          )}
          {!error && fileUrl && fileType === "epub" && <div ref={mountRef} className="h-full w-full rounded-lg" />}
          <p className="mt-2 text-xs text-slate-500">Lecture protegee reservee au site et a l application Holistique Books. Telechargement de fichier desactive.</p>
        </div>
      </div>
    </div>
  );
}
