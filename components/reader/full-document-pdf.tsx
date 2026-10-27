"use client";

import { useEffect, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

type Props = {
  fileUrl: string;
  pageNumbers: number[];
  scale: number;
  onPageCount: (count: number) => void;
  onError: (message: string | null) => void;
};

function PdfCanvas({ document, pageNumber, scale, onError }: {
  document: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  onError: Props["onError"];
}) {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [rendering, setRendering] = useState(true);

  useEffect(() => {
    if (!canvas) return;
    let cancelled = false;
    let task: ReturnType<Awaited<ReturnType<PDFDocumentProxy["getPage"]>>["render"]> | null = null;

    async function paint() {
      setRendering(true);
      try {
        const page = await document.getPage(pageNumber);
        if (cancelled) return;
        const viewport = page.getViewport({ scale: Math.max(0.7, Math.min(2, scale)) * 1.35 });
        canvas!.width = Math.ceil(viewport.width);
        canvas!.height = Math.ceil(viewport.height);
        const context = canvas!.getContext("2d", { alpha: false });
        if (!context) throw new Error("Affichage PDF indisponible.");
        task = page.render({ canvas: canvas!, canvasContext: context, viewport });
        await task.promise;
        if (!cancelled) setRendering(false);
      } catch (error) {
        if (!cancelled) onError(error instanceof Error ? error.message : "Page PDF indisponible.");
      }
    }
    void paint();
    return () => { cancelled = true; task?.cancel(); };
  }, [canvas, document, pageNumber, scale, onError]);

  return <figure className="relative flex min-h-40 justify-center bg-white">
    {rendering ? <span role="status" className="absolute top-5 text-xs text-slate-500">Affichage de la page {pageNumber}…</span> : null}
    <canvas ref={setCanvas} className="h-auto max-w-full bg-white" aria-label={`Page ${pageNumber}`} />
  </figure>;
}

/** Fetch the entire free document once; changing page renders from the same in-memory PDF. */
export function FullDocumentPdf({ fileUrl, pageNumbers, scale, onPageCount, onError }: Props) {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let loadingTask: ReturnType<(typeof import("pdfjs-dist"))["getDocument"]> | null = null;
    setDocument(null);
    setLoading(true);

    async function load() {
      try {
        const response = await fetch(fileUrl, { cache: "force-cache" });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({ error: "Lecture indisponible." }));
          throw new Error(payload.error ?? "Lecture indisponible.");
        }
        const buffer = await response.arrayBuffer();
        if (cancelled) return;
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer), isEvalSupported: false, useSystemFonts: true });
        const pdf = await loadingTask.promise;
        if (cancelled) { await pdf.destroy(); return; }
        setDocument(pdf);
        onPageCount(pdf.numPages);
        setLoading(false);
      } catch (error) {
        if (!cancelled) {
          setLoading(false);
          onError(error instanceof Error ? error.message : "Lecture indisponible.");
        }
      }
    }
    void load();
    return () => { cancelled = true; void loadingTask?.destroy(); };
  }, [fileUrl, onPageCount, onError]);

  if (loading) return <div role="status" className="flex h-full items-center justify-center bg-slate-100 text-sm text-slate-600">Chargement unique du livre gratuit…</div>;
  if (!document) return null;

  return (
    <div className="h-full overflow-auto rounded-lg bg-slate-200 p-3 sm:p-5">
      <div className={pageNumbers.length > 1 ? "mx-auto grid max-w-[1500px] gap-6 xl:grid-cols-2" : "mx-auto max-w-[950px]"}>
        {pageNumbers.filter((n) => n > 0 && n <= document.numPages).map((n) =>
          <PdfCanvas key={n} document={document} pageNumber={n} scale={scale} onError={onError} />)}
      </div>
    </div>
  );
}
