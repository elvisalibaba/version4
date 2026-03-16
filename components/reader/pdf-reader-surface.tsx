"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist/types/src/display/api";

type PdfReaderSurfaceProps = {
  fileUrl: string;
  pageNumber: number;
  scale: number;
  onPageCount: (count: number) => void;
  onError: (message: string | null) => void;
};

const READER_FETCH_HEADERS = {
  "X-Holistique-Reader": "web",
};

export function PdfReaderSurface({ fileUrl, pageNumber, scale, onPageCount, onError }: PdfReaderSurfaceProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const documentRef = useRef<PDFDocumentProxy | null>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const [isLoadingDocument, setIsLoadingDocument] = useState(true);
  const [isRenderingPage, setIsRenderingPage] = useState(false);

  useEffect(() => {
    let cancelled = false;

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
      renderTaskRef.current?.cancel?.();

      if (documentRef.current) {
        const currentDocument = documentRef.current;
        documentRef.current = null;
        void currentDocument.destroy?.();
      }
    };
  }, [fileUrl, onError, onPageCount]);

  useEffect(() => {
    let cancelled = false;

    async function renderPage() {
      const pdfDocument = documentRef.current;
      const canvas = canvasRef.current;

      if (!pdfDocument || !canvas) {
        return;
      }

      setIsRenderingPage(true);
      onError(null);

      try {
        const page = await pdfDocument.getPage(pageNumber);
        if (cancelled) return;

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

        renderTaskRef.current?.cancel?.();
        const renderTask = page.render({
          canvas,
          canvasContext: context,
          viewport,
          transform: devicePixelRatio !== 1 ? [devicePixelRatio, 0, 0, devicePixelRatio, 0, 0] : undefined,
        });

        renderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (error: unknown) {
        if (!cancelled && (!(error instanceof Error) || error.name !== "RenderingCancelledException")) {
          onError(error instanceof Error ? error.message : "Cette page PDF ne peut pas etre affichee.");
        }
      } finally {
        if (!cancelled) {
          setIsRenderingPage(false);
        }
      }
    }

    renderPage();

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel?.();
    };
  }, [onError, pageNumber, scale]);

  return (
    <div
      className="relative flex h-full min-h-[60vh] w-full items-start justify-center overflow-auto rounded-lg bg-[#0d1320] p-4"
      onContextMenu={(event) => event.preventDefault()}
    >
      {(isLoadingDocument || isRenderingPage) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0d1320]/70 text-sm font-medium text-white backdrop-blur-sm">
          Chargement du lecteur PDF...
        </div>
      )}
      <canvas ref={canvasRef} className="max-w-full rounded-md shadow-[0_24px_60px_rgba(15,23,42,0.45)]" />
    </div>
  );
}
