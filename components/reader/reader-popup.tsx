"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PdfReaderSurface } from "@/components/reader/pdf-reader-surface";
import type { Database } from "@/types/database";

type EpubTheme = "light" | "sepia" | "dark";
type HighlightColor = "yellow" | "blue" | "pink" | "green";
type ReaderHighlight = Pick<
  Database["public"]["Tables"]["highlights"]["Row"],
  "id" | "page" | "text" | "note" | "color" | "created_at"
>;

type TocItem = {
  href: string;
  label: string;
  depth: number;
};

type EpubNavigationItem = {
  href?: string;
  label?: string;
  subitems?: EpubNavigationItem[];
};

type EpubLocation = {
  start?: {
    cfi?: string;
    displayed?: {
      page: number;
      total: number;
    };
    percentage?: number;
  };
};

type EpubContents = {
  window?: Window;
  document?: Document;
};

type EpubRendition = {
  prev: () => void;
  next: () => void;
  destroy: () => void;
  display: (target?: string) => Promise<void>;
  on: (eventName: string, callback: (...args: unknown[]) => void) => void;
  themes: {
    register: (name: string, styles: { body: Record<string, string> }) => void;
    select: (name: string) => void;
    fontSize: (size: string) => void;
    override?: (name: string, value: string, priority?: boolean) => void;
  };
  annotations?: {
    add: (
      type: string,
      cfiRange: string,
      data?: unknown,
      callback?: unknown,
      className?: string,
      styles?: Record<string, string>,
    ) => void;
  };
};

type EpubBook = {
  renderTo: (element: HTMLElement, options: { width: string; height: string }) => EpubRendition;
  navigation?: {
    toc?: EpubNavigationItem[];
  };
  loaded?: {
    navigation?: Promise<unknown>;
  };
  destroy?: () => void;
};

const READER_FETCH_HEADERS = {
  "X-Holistique-Reader": "web",
};

const HIGHLIGHT_COLOR_OPTIONS: Array<{
  value: HighlightColor;
  label: string;
  buttonClassName: string;
  annotationStyles: Record<string, string>;
}> = [
  {
    value: "yellow",
    label: "Jaune",
    buttonClassName: "border-amber-200 bg-amber-50 text-amber-800",
    annotationStyles: { fill: "#facc15", "fill-opacity": "0.28" },
  },
  {
    value: "blue",
    label: "Bleu",
    buttonClassName: "border-sky-200 bg-sky-50 text-sky-800",
    annotationStyles: { fill: "#38bdf8", "fill-opacity": "0.22" },
  },
  {
    value: "pink",
    label: "Rose",
    buttonClassName: "border-rose-200 bg-rose-50 text-rose-800",
    annotationStyles: { fill: "#fb7185", "fill-opacity": "0.2" },
  },
  {
    value: "green",
    label: "Vert",
    buttonClassName: "border-emerald-200 bg-emerald-50 text-emerald-800",
    annotationStyles: { fill: "#34d399", "fill-opacity": "0.22" },
  },
];

function flattenToc(items: EpubNavigationItem[] | undefined, depth = 0): TocItem[] {
  if (!items?.length) {
    return [];
  }

  return items.flatMap((item) => {
    const currentItem =
      item.href && item.label
        ? [
            {
              href: item.href,
              label: item.label,
              depth,
            },
          ]
        : [];

    return [...currentItem, ...flattenToc(item.subitems, depth + 1)];
  });
}

function formatHighlightDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getHighlightColorOption(color: string) {
  return HIGHLIGHT_COLOR_OPTIONS.find((option) => option.value === color) ?? HIGHLIGHT_COLOR_OPTIONS[0];
}

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
  const bookRef = useRef<EpubBook | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<"epub" | "pdf" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [readerProfileId, setReaderProfileId] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<ReaderHighlight[]>([]);
  const [selectedQuote, setSelectedQuote] = useState("");
  const [selectedCfiRange, setSelectedCfiRange] = useState<string | null>(null);
  const [highlightNote, setHighlightNote] = useState("");
  const [highlightColor, setHighlightColor] = useState<HighlightColor>("yellow");
  const [savingHighlight, setSavingHighlight] = useState(false);
  const [deletingHighlightId, setDeletingHighlightId] = useState<string | null>(null);
  const [epubFontSize, setEpubFontSize] = useState(105);
  const [epubTheme, setEpubTheme] = useState<EpubTheme>("light");
  const [epubLineHeight, setEpubLineHeight] = useState(1.7);
  const [epubProgress, setEpubProgress] = useState(0);
  const [epubCurrentPage, setEpubCurrentPage] = useState(1);
  const [epubTotalPages, setEpubTotalPages] = useState(0);
  const [epubToc, setEpubToc] = useState<TocItem[]>([]);
  const [pdfPageNumber, setPdfPageNumber] = useState(1);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [pdfScale, setPdfScale] = useState(1.1);
  const [pdfSpreadMode, setPdfSpreadMode] = useState(true);
  const [pdfJumpInput, setPdfJumpInput] = useState("1");

  const isEpub = useMemo(() => fileType === "epub", [fileType]);
  const isPdf = useMemo(() => fileType === "pdf", [fileType]);
  const pdfStep = pdfSpreadMode ? 2 : 1;
  const pdfVisiblePages = useMemo(
    () => (pdfSpreadMode ? [pdfPageNumber, pdfPageNumber + 1] : [pdfPageNumber]),
    [pdfPageNumber, pdfSpreadMode],
  );
  const currentReaderPage = isPdf ? pdfPageNumber : epubCurrentPage;
  const currentColorOption = getHighlightColorOption(highlightColor);
  const pdfPageLabel =
    pdfPageCount > 0 && pdfSpreadMode && pdfPageNumber < pdfPageCount
      ? `Pages ${pdfPageNumber}-${Math.min(pdfPageCount, pdfPageNumber + 1)} / ${pdfPageCount}`
      : `Page ${pdfPageNumber}${pdfPageCount > 0 ? ` / ${pdfPageCount}` : ""}`;

  useEffect(() => {
    async function bootstrapReader() {
      if (!open) {
        return;
      }

      setError(null);
      setFileUrl(null);
      setFileType(null);
      setReaderProfileId(null);
      setHighlights([]);
      setSelectedQuote("");
      setSelectedCfiRange(null);
      setHighlightNote("");
      setPdfPageNumber(1);
      setPdfPageCount(0);
      setPdfScale(1.1);
      setPdfJumpInput("1");
      setEpubProgress(0);
      setEpubCurrentPage(1);
      setEpubTotalPages(0);
      setEpubToc([]);

      try {
        const supabase = createClient();
        const [readerResponse, authResult] = await Promise.all([fetch(`/api/read/${bookId}`), supabase.auth.getUser()]);
        const readerPayload = await readerResponse.json();

        if (!readerResponse.ok) {
          setError(readerPayload.error ?? "Impossible d ouvrir ce livre.");
          return;
        }

        setFileUrl(readerPayload.readerUrl);
        setFileType(readerPayload.fileType);

        const user = authResult.data.user;
        if (!user) {
          return;
        }

        setReaderProfileId(user.id);

        const { data: highlightRows, error: highlightError } = await supabase
          .from("highlights")
          .select("id, page, text, note, color, created_at")
          .eq("user_id", user.id)
          .eq("book_id", bookId)
          .order("created_at", { ascending: false });

        if (highlightError) {
          console.warn("[ReaderPopup] Unable to load highlights for the current reader.", highlightError.message);
          return;
        }

        setHighlights((highlightRows ?? []) as ReaderHighlight[]);
      } catch {
        setError("Le lecteur securise ne repond pas pour le moment.");
      }
    }

    bootstrapReader();
  }, [bookId, open]);

  useEffect(() => {
    if (!open || !fileUrl || !isEpub || !mountRef.current) {
      return;
    }

    let cancelled = false;
    const readerFileUrl = fileUrl;

    async function renderEpub() {
      const [epubModule, response] = await Promise.all([
        import("epubjs"),
        fetch(readerFileUrl, {
          headers: READER_FETCH_HEADERS,
          cache: "no-store",
          credentials: "same-origin",
        }),
      ]);

      if (!response.ok) {
        throw new Error("Impossible de charger ce livre dans le lecteur securise.");
      }

      if (cancelled || !mountRef.current) {
        return;
      }

      const bytes = await response.arrayBuffer();
      mountRef.current.innerHTML = "";

      const book = epubModule.default(bytes) as EpubBook;
      const rendition = book.renderTo(mountRef.current, {
        width: "100%",
        height: "100%",
      });

      rendition.themes.register("light", {
        body: {
          background: "#ffffff",
          color: "#0f172a",
          "font-family": "'Iowan Old Style', Georgia, serif",
        },
      });
      rendition.themes.register("sepia", {
        body: {
          background: "#f8f1e3",
          color: "#4b3b2a",
          "font-family": "'Iowan Old Style', Georgia, serif",
        },
      });
      rendition.themes.register("dark", {
        body: {
          background: "#111827",
          color: "#e5e7eb",
          "font-family": "'Iowan Old Style', Georgia, serif",
        },
      });

      rendition.on("relocated", (locationValue: unknown) => {
        const location = locationValue as EpubLocation;
        const percentage = location.start?.percentage ?? 0;
        setEpubProgress(Math.round(percentage * 100));
        setEpubCurrentPage(location.start?.displayed?.page ?? 1);
        setEpubTotalPages(location.start?.displayed?.total ?? 0);
      });

      rendition.on("selected", (cfiRangeValue: unknown, contentsValue: unknown) => {
        const contents = contentsValue as EpubContents;
        const selectedText =
          contents.window?.getSelection?.()?.toString().trim() ??
          contents.document?.getSelection?.()?.toString().trim() ??
          "";

        setSelectedCfiRange(typeof cfiRangeValue === "string" ? cfiRangeValue : null);
        setSelectedQuote(selectedText);
      });

      bookRef.current = book;
      renditionRef.current = rendition;

      if (book.loaded?.navigation) {
        await book.loaded.navigation;
        if (!cancelled) {
          setEpubToc(flattenToc(book.navigation?.toc));
        }
      }

      await rendition.display();
    }

    renderEpub().catch((readerError) => {
      if (!cancelled) {
        setError(readerError instanceof Error ? readerError.message : "Lecture EPUB indisponible.");
      }
    });

    return () => {
      cancelled = true;
      renditionRef.current?.destroy();
      renditionRef.current = null;
      bookRef.current?.destroy?.();
      bookRef.current = null;
    };
  }, [fileUrl, isEpub, open]);

  useEffect(() => {
    const rendition = renditionRef.current;
    if (!rendition) {
      return;
    }

    rendition.themes.select(epubTheme);
    rendition.themes.fontSize(`${epubFontSize}%`);
    rendition.themes.override?.("line-height", String(epubLineHeight));
  }, [epubFontSize, epubLineHeight, epubTheme]);

  useEffect(() => {
    if (pdfSpreadMode && pdfPageNumber > 1 && pdfPageNumber % 2 === 0) {
      setPdfPageNumber((previous) => Math.max(1, previous - 1));
    }
  }, [pdfPageNumber, pdfSpreadMode]);

  useEffect(() => {
    if (pdfPageCount <= 0) {
      return;
    }

    const maxStartPage = pdfSpreadMode ? Math.max(1, pdfPageCount - 1) : pdfPageCount;
    if (pdfPageNumber > maxStartPage) {
      setPdfPageNumber(maxStartPage);
      setPdfJumpInput(String(maxStartPage));
    }
  }, [pdfPageCount, pdfPageNumber, pdfSpreadMode]);

  useEffect(() => {
    setPdfJumpInput(String(pdfPageNumber));
  }, [pdfPageNumber]);

  function openFullScreen() {
    if (!containerRef.current) {
      return;
    }

    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }

    void containerRef.current.requestFullscreen();
  }

  function goToPdfPage() {
    const parsedPage = Number(pdfJumpInput);
    if (!Number.isFinite(parsedPage)) {
      return;
    }

    const normalizedPage = Math.max(1, Math.min(pdfPageCount || parsedPage, Math.floor(parsedPage)));
    setPdfPageNumber(pdfSpreadMode && normalizedPage > 1 && normalizedPage % 2 === 0 ? normalizedPage - 1 : normalizedPage);
  }

  async function saveHighlight() {
    if (!readerProfileId) {
      setError("Reconnectez-vous pour sauvegarder vos notes de lecture.");
      return;
    }

    if (!highlightNote.trim() && !selectedQuote.trim()) {
      setError("Ajoutez une note ou selectionnez un passage important avant d enregistrer.");
      return;
    }

    setSavingHighlight(true);
    setError(null);

    try {
      const supabase = createClient();
      const payload: Database["public"]["Tables"]["highlights"]["Insert"] = {
        user_id: readerProfileId,
        book_id: bookId,
        page: Math.max(1, currentReaderPage || 1),
        text: selectedQuote.trim() || null,
        note: highlightNote.trim() || null,
        color: highlightColor,
      };

      const { data: createdHighlight, error: highlightError } = await supabase
        .from("highlights")
        .insert(payload)
        .select("id, page, text, note, color, created_at")
        .single();

      if (highlightError || !createdHighlight) {
        throw new Error(highlightError?.message ?? "Enregistrement du surlignage impossible.");
      }

      if (selectedCfiRange && isEpub) {
        renditionRef.current?.annotations?.add(
          "highlight",
          selectedCfiRange,
          {},
          undefined,
          "hb-reader-highlight",
          currentColorOption.annotationStyles,
        );
      }

      setHighlights((previous) => [createdHighlight as ReaderHighlight, ...previous]);
      setHighlightNote("");
      setSelectedQuote("");
      setSelectedCfiRange(null);
    } catch (highlightSaveError) {
      setError(highlightSaveError instanceof Error ? highlightSaveError.message : "Impossible d enregistrer cette note.");
    } finally {
      setSavingHighlight(false);
    }
  }

  async function deleteHighlight(highlightId: string) {
    setDeletingHighlightId(highlightId);
    setError(null);

    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase.from("highlights").delete().eq("id", highlightId);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      setHighlights((previous) => previous.filter((entry) => entry.id !== highlightId));
    } catch (deleteHighlightError) {
      setError(deleteHighlightError instanceof Error ? deleteHighlightError.message : "Impossible de supprimer cette note.");
    } finally {
      setDeletingHighlightId(null);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="reader-modal fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-2 backdrop-blur-sm sm:p-4">
      <div ref={containerRef} className="reader-window flex h-[96vh] w-full max-w-[92rem] flex-col overflow-hidden rounded-[2rem] border border-[#221d17] bg-[#111827]">
        <div className="reader-toolbar flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0f172a] px-3 py-3 text-white sm:px-4 sm:py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f7c78f]">Reader Pro</p>
            <h3 className="mt-1 text-lg font-semibold">Lecteur web securise</h3>
            <p className="mt-1 text-xs text-white/60">
              {isPdf ? pdfPageLabel : `Progression ${epubProgress}%${epubTotalPages > 0 ? ` • Page ${epubCurrentPage}/${epubTotalPages}` : ""}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isEpub ? (
              <>
                <button type="button" onClick={() => renditionRef.current?.prev()} className="cta-secondary px-3 py-2 text-xs sm:text-sm">
                  Precedent
                </button>
                <button type="button" onClick={() => renditionRef.current?.next()} className="cta-secondary px-3 py-2 text-xs sm:text-sm">
                  Suivant
                </button>
              </>
            ) : null}

            {isPdf ? (
              <>
                <button type="button" onClick={() => setPdfPageNumber((prev) => Math.max(1, prev - pdfStep))} className="cta-secondary px-3 py-2 text-xs sm:text-sm">
                  Pages precedentes
                </button>
                <button
                  type="button"
                  onClick={() => setPdfPageNumber((prev) => Math.min(Math.max(1, pdfPageCount - (pdfSpreadMode ? 1 : 0)), prev + pdfStep))}
                  className="cta-secondary px-3 py-2 text-xs sm:text-sm"
                >
                  Pages suivantes
                </button>
              </>
            ) : null}

            <button type="button" onClick={openFullScreen} className="cta-secondary px-3 py-2 text-xs sm:text-sm">
              Plein ecran
            </button>
            <button type="button" onClick={onClose} className="cta-primary px-3 py-2 text-xs sm:text-sm">
              Fermer
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden p-2 sm:p-4">
          {error ? (
            <div className="mb-4 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {!error && !fileUrl ? (
            <div className="flex h-full items-center justify-center rounded-[1.75rem] border border-white/10 bg-[#0f172a] text-sm text-white/70">
              Chargement du lecteur...
            </div>
          ) : null}

          {!error && fileUrl ? (
            <div className="grid h-full gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="min-h-0 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,_rgba(15,23,42,0.96),_rgba(17,24,39,0.98))] p-3">
                {fileType === "pdf" ? (
                  <PdfReaderSurface
                    fileUrl={fileUrl}
                    pageNumbers={pdfVisiblePages}
                    scale={pdfScale}
                    spreadMode={pdfSpreadMode}
                    onPageCount={setPdfPageCount}
                    onError={setError}
                  />
                ) : (
                  <div className="flex h-full min-h-[70vh] flex-col overflow-hidden rounded-[1.5rem] bg-[#f5efe6] p-2 shadow-[0_20px_40px_rgba(15,23,42,0.22)]">
                    <div ref={mountRef} className="h-full w-full overflow-hidden rounded-[1.1rem] bg-white" onContextMenu={(event) => event.preventDefault()} />
                  </div>
                )}
              </div>

              <aside className="min-h-0 overflow-auto rounded-[1.75rem] border border-white/10 bg-[#0f172a] p-4 text-white">
                <section className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f7c78f]">Outils lecture</p>

                  {isEpub ? (
                    <div className="mt-4 space-y-4">
                      <div className="grid gap-3">
                        <label className="grid gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">Taille du texte</span>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setEpubFontSize((prev) => Math.max(85, prev - 10))} className="cta-secondary px-3 py-2 text-xs">
                              A-
                            </button>
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70">{epubFontSize}%</span>
                            <button type="button" onClick={() => setEpubFontSize((prev) => Math.min(170, prev + 10))} className="cta-secondary px-3 py-2 text-xs">
                              A+
                            </button>
                          </div>
                        </label>

                        <label className="grid gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">Interligne</span>
                          <input
                            type="range"
                            min="1.4"
                            max="2.1"
                            step="0.1"
                            value={epubLineHeight}
                            onChange={(event) => setEpubLineHeight(Number(event.target.value))}
                          />
                          <span className="text-xs text-white/60">{epubLineHeight.toFixed(1)}</span>
                        </label>

                        <label className="grid gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">Ambiance</span>
                          <select
                            value={epubTheme}
                            onChange={(event) => setEpubTheme(event.target.value as EpubTheme)}
                            className="min-h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white"
                          >
                            <option value="light">Clair</option>
                            <option value="sepia">Sepia</option>
                            <option value="dark">Sombre</option>
                          </select>
                        </label>
                      </div>

                      <div className="rounded-[1.1rem] border border-white/10 bg-white/5 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">Progression</p>
                        <p className="mt-2 text-lg font-semibold text-white">{epubProgress}%</p>
                        <p className="mt-1 text-xs text-white/60">
                          {epubTotalPages > 0 ? `Page ${epubCurrentPage} sur ${epubTotalPages}` : "Position calculee automatiquement"}
                        </p>
                      </div>

                      <div className="rounded-[1.1rem] border border-white/10 bg-white/5 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">Table des matieres</p>
                        <div className="mt-3 max-h-64 space-y-2 overflow-auto pr-1">
                          {epubToc.length > 0 ? (
                            epubToc.map((item) => (
                              <button
                                key={`${item.href}-${item.label}`}
                                type="button"
                                onClick={() => renditionRef.current?.display(item.href)}
                                className="block w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-white/80 transition hover:border-[#f7c78f]/40 hover:bg-white/10"
                                style={{ paddingLeft: `${item.depth * 14 + 12}px` }}
                              >
                                {item.label}
                              </button>
                            ))
                          ) : (
                            <p className="text-sm text-white/50">La table des matieres sera chargee si elle existe dans l EPUB.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {isPdf ? (
                    <div className="mt-4 space-y-4">
                      <div className="grid gap-3">
                        <label className="grid gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">Aller a la page</span>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min="1"
                              max={pdfPageCount || undefined}
                              value={pdfJumpInput}
                              onChange={(event) => setPdfJumpInput(event.target.value)}
                              className="min-h-11 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white"
                            />
                            <button type="button" onClick={goToPdfPage} className="cta-primary px-4 py-2 text-sm">
                              Aller
                            </button>
                          </div>
                        </label>

                        <label className="grid gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">Zoom</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPdfScale((prev) => Math.max(0.8, Number((prev - 0.1).toFixed(2))))}
                              className="cta-secondary px-3 py-2 text-xs"
                            >
                              -
                            </button>
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70">
                              {Math.round(pdfScale * 100)}%
                            </span>
                            <button
                              type="button"
                              onClick={() => setPdfScale((prev) => Math.min(2.2, Number((prev + 0.1).toFixed(2))))}
                              className="cta-secondary px-3 py-2 text-xs"
                            >
                              +
                            </button>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 rounded-[1.1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                          <input
                            type="checkbox"
                            checked={pdfSpreadMode}
                            onChange={(event) => setPdfSpreadMode(event.target.checked)}
                          />
                          Affichage livre ouvert
                        </label>
                      </div>

                      <div className="rounded-[1.1rem] border border-white/10 bg-white/5 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">Mode PDF</p>
                        <p className="mt-2 text-sm leading-6 text-white/70">
                          Le PDF peut maintenant se lire page par page ou en double page pour retrouver une sensation plus proche d un vrai livre imprime.
                        </p>
                      </div>
                    </div>
                  ) : null}
                </section>

                <section className="mt-4 rounded-[1.35rem] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f7c78f]">Notes & surlignages</p>
                      <p className="mt-2 text-sm text-white/70">
                        {isEpub
                          ? "Selectionnez un passage dans l EPUB ou ajoutez une note sur la page courante."
                          : "Ajoutez une note importante sur la page courante du PDF."}
                      </p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${currentColorOption.buttonClassName}`}>
                      {currentColorOption.label}
                    </span>
                  </div>

                  {selectedQuote ? (
                    <div className="mt-4 rounded-[1.1rem] border border-[#f7c78f]/30 bg-[#f7c78f]/10 px-4 py-3 text-sm leading-6 text-white/80">
                      {selectedQuote}
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {HIGHLIGHT_COLOR_OPTIONS.map((option) => {
                      const active = option.value === highlightColor;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setHighlightColor(option.value)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${option.buttonClassName} ${active ? "ring-2 ring-offset-2 ring-offset-[#0f172a] ring-white/30" : ""}`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>

                  <label className="mt-4 grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">Note perso</span>
                    <textarea
                      rows={4}
                      value={highlightNote}
                      onChange={(event) => setHighlightNote(event.target.value)}
                      placeholder={isPdf ? "Exemple: passage cle a revoir sur cette page." : "Exemple: idee importante, commentaire, priere ou point a memoriser."}
                      className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white placeholder:text-white/35"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={saveHighlight}
                    disabled={savingHighlight}
                    className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-[#f7c78f] px-4 text-sm font-semibold text-[#111827] transition hover:bg-[#f3b96f] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {savingHighlight ? "Enregistrement..." : `Enregistrer page ${Math.max(1, currentReaderPage || 1)}`}
                  </button>

                  <div className="mt-5 space-y-3">
                    {highlights.length > 0 ? (
                      highlights.map((highlight) => {
                        const option = getHighlightColorOption(highlight.color);

                        return (
                          <article key={highlight.id} className="rounded-[1.1rem] border border-white/10 bg-[#0b1220] p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">
                                  Page {highlight.page} • {formatHighlightDate(highlight.created_at)}
                                </p>
                                <span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold ${option.buttonClassName}`}>
                                  {option.label}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => deleteHighlight(highlight.id)}
                                disabled={deletingHighlightId === highlight.id}
                                className="text-xs font-semibold text-rose-300 transition hover:text-rose-200 disabled:opacity-50"
                              >
                                {deletingHighlightId === highlight.id ? "..." : "Supprimer"}
                              </button>
                            </div>
                            {highlight.text ? <p className="mt-3 text-sm leading-6 text-white/80">{highlight.text}</p> : null}
                            {highlight.note ? <p className="mt-3 text-sm leading-6 text-white/60">{highlight.note}</p> : null}
                          </article>
                        );
                      })
                    ) : (
                      <p className="text-sm text-white/45">Aucune note enregistree pour ce livre pour le moment.</p>
                    )}
                  </div>
                </section>

                <p className="mt-4 text-xs leading-6 text-white/40">
                  Lecture protegee reservee au site et a l application Holistique Books. Le telechargement direct du fichier reste desactive.
                </p>
              </aside>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
