"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist/types/src/display/api";

type PdfReaderSurfaceProps = {
  fileUrl: string;
  pageNumbers: number[];
  scale: number;
  spreadMode: boolean;
  onPageCount: (count: number) => void;
  onError: (message: string | null) => void;
};

const READER_FETCH_HEADERS = {
  "X-Holistique-Reader": "web",
};

export function PdfReaderSurface({ fileUrl, pageNumbers, scale, spreadMode, onPageCount, onError }: PdfReaderSurfaceProps) {
  const documentRef = useRef<PDFDocumentProxy | null>(null);
  const renderTasksRef = useRef<Map<number, RenderTask>>(new Map());
  const canvasMapRef = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const [isLoadingDocument, setIsLoadingDocument] = useState(true);
  const [isRenderingPages, setIsRenderingPages] = useState(false);
  const [resolvedPageCount, setResolvedPageCount] = useState(0);

  const visiblePages = useMemo(() => {
    const uniquePages = Array.from(new Set(pageNumbers.filter((page) => page > 0)));
    return resolvedPageCount > 0 ? uniquePages.filter((page) => page <= resolvedPageCount) : uniquePages;
  }, [pageNumbers, resolvedPageCount]);

  function registerCanvas(pageNumber: number, node: HTMLCanvasElement | null) {
    if (node) {
      canvasMapRef.current.set(pageNumber, node);
      return;
    }

    canvasMapRef.current.delete(pageNumber);
  }

  useEffect(() => {
    let cancelled = false;
    const renderTasks = renderTasksRef.current;

    async function loadDocument() {
      setIsLoadingDocument(true);
      onError(null);

      try {
        const [pdfjs, response] = await Promise.all([
          import("pdfjs-dist"),
          fetch(fileUrl, {
            headers: READER_FETCH_HEADERS,
            cache: "no-store",
            credentials: "same-origin",
          }),
        ]);

        if (!response.ok) {
          throw new Error("Impossible de charger ce PDF dans le lecteur securise.");
        }

        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const bytes = await response.arrayBuffer();
        const loadingTask = pdfjs.getDocument({
          data: bytes,
          disableAutoFetch: true,
          disableStream: true,
        });
        const pdfDocument = await loadingTask.promise;

        if (cancelled) {
          void pdfDocument.destroy();
          return;
        }

        documentRef.current = pdfDocument;
        setResolvedPageCount(pdfDocument.numPages);
        onPageCount(pdfDocument.numPages);
      } catch (error) {
        if (!cancelled) {
          onError(error instanceof Error ? error.message : "Lecture PDF indisponible.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingDocument(false);
        }
      }
    }

    loadDocument();

    return () => {
      cancelled = true;
      renderTasks.forEach((task) => task.cancel?.());
      renderTasks.clear();

      if (documentRef.current) {
        const currentDocument = documentRef.current;
        documentRef.current = null;
        void currentDocument.destroy?.();
      }
    };
  }, [fileUrl, onError, onPageCount]);

  useEffect(() => {
    let cancelled = false;
    const renderTasks = renderTasksRef.current;

    async function renderPages() {
      const pdfDocument = documentRef.current;
      if (!pdfDocument || visiblePages.length === 0) {
        return;
      }

      setIsRenderingPages(true);
      onError(null);

      try {
        for (const pageNumber of visiblePages) {
          const canvas = canvasMapRef.current.get(pageNumber);
          if (!canvas) {
            continue;
          }

          const page = await pdfDocument.getPage(pageNumber);
          if (cancelled) {
            return;
          }

          const viewport = page.getViewport({ scale });
          const devicePixelRatio = window.devicePixelRatio || 1;
          const context = canvas.getContext("2d");

          if (!context) {
            throw new Error("Impossible d initialiser le rendu PDF.");
          }

          canvas.width = Math.floor(viewport.width * devicePixelRatio);
          canvas.height = Math.floor(viewport.height * devicePixelRatio);
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;

          renderTasks.get(pageNumber)?.cancel?.();
          const renderTask = page.render({
            canvas,
            canvasContext: context,
            viewport,
            transform: devicePixelRatio !== 1 ? [devicePixelRatio, 0, 0, devicePixelRatio, 0, 0] : undefined,
          });

          renderTasks.set(pageNumber, renderTask);
          await renderTask.promise;
        }
      } catch (error: unknown) {
        if (!cancelled && (!(error instanceof Error) || error.name !== "RenderingCancelledException")) {
          onError(error instanceof Error ? error.message : "Cette page PDF ne peut pas etre affichee.");
        }
      } finally {
        if (!cancelled) {
          setIsRenderingPages(false);
        }
      }
    }

    renderPages();

    return () => {
      cancelled = true;
      visiblePages.forEach((pageNumber) => renderTasks.get(pageNumber)?.cancel?.());
    };
  }, [onError, scale, visiblePages]);

  return (
    <div
      className="relative flex h-full min-h-[60vh] w-full items-start justify-center overflow-auto rounded-[1.35rem] bg-[#2b211b] p-4"
      onContextMenu={(event) => event.preventDefault()}
    >
      {(isLoadingDocument || isRenderingPages) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#2b211b]/75 text-sm font-medium text-white backdrop-blur-sm">
          Chargement du lecteur PDF...
        </div>
      )}

      <div className={`grid w-full gap-6 ${spreadMode && visiblePages.length > 1 ? "xl:grid-cols-2" : "max-w-5xl"}`}>
        {visiblePages.map((pageNumber) => (
          <figure
            key={pageNumber}
            className="rounded-[1.5rem] border border-[#d8c7b2] bg-[#f8f1e7] p-4 shadow-[0_24px_60px_rgba(15,23,42,0.38)]"
          >
            <div className="flex justify-center">
              <canvas ref={(node) => registerCanvas(pageNumber, node)} className="max-w-full rounded-[0.85rem] shadow-[0_12px_30px_rgba(15,23,42,0.16)]" />
            </div>
            <figcaption className="mt-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[#7a6655]">
              Page {pageNumber}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
