"use client";

import { useEffect, useMemo, useState } from "react";

type PdfReaderSurfaceProps = {
  fileUrl: string;
  pageNumbers: number[];
  scale: number;
  spreadMode: boolean;
  pageCountHint: number | null;
  watermarkText?: string | null;
  onPageCount: (count: number) => void;
  onError: (message: string | null) => void;
};

function pageUrl(fileUrl: string, pageNumber: number) {
  const separator = fileUrl.includes("?") ? "&" : "?";
  return `${fileUrl}${separator}page=${pageNumber}`;
}

export function PdfReaderSurface({
  fileUrl,
  pageNumbers,
  scale,
  spreadMode,
  pageCountHint,
  watermarkText,
  onPageCount,
  onError,
}: PdfReaderSurfaceProps) {
  const [loadingPages, setLoadingPages] = useState<Set<number>>(new Set());

  const visiblePages = useMemo(() => {
    const uniquePages = Array.from(new Set(pageNumbers.filter((page) => page > 0)));
    return pageCountHint && pageCountHint > 0
      ? uniquePages.filter((page) => page <= pageCountHint)
      : uniquePages;
  }, [pageCountHint, pageNumbers]);

  useEffect(() => {
    if (pageCountHint && pageCountHint > 0) {
      onPageCount(pageCountHint);
    }
  }, [onPageCount, pageCountHint]);

  useEffect(() => {
    setLoadingPages(new Set(visiblePages));
    onError(null);
  }, [fileUrl, onError, visiblePages]);

  function markLoaded(pageNumber: number) {
    setLoadingPages((current) => {
      const next = new Set(current);
      next.delete(pageNumber);
      return next;
    });
  }

  function markError(pageNumber: number) {
    markLoaded(pageNumber);
    onError(`La page ${pageNumber} ne peut pas être affichée dans le lecteur sécurisé.`);
  }

  return (
    <div
      className="relative flex h-full min-h-0 w-full items-start justify-center overflow-auto rounded-none bg-[#2b211b] p-1.5 sm:rounded-[1.35rem] sm:p-4"
      onContextMenu={(event) => event.preventDefault()}
    >
      {loadingPages.size > 0 ? (
        <div className="pointer-events-none absolute inset-x-0 top-4 z-30 flex justify-center">
          <span className="rounded-full bg-black/70 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur">
            Chargement sécurisé de {loadingPages.size > 1 ? "vos pages" : "la page"}...
          </span>
        </div>
      ) : null}

      <div className={`grid w-full gap-6 ${spreadMode && visiblePages.length > 1 ? "xl:grid-cols-2" : "max-w-5xl"}`}>
        {visiblePages.map((pageNumber) => (
          <figure
            key={pageNumber}
            className="relative overflow-hidden rounded-xl border border-[#d8c7b2] bg-[#f8f1e7] p-1.5 shadow-[0_24px_60px_rgba(15,23,42,0.38)] sm:rounded-[1.5rem] sm:p-4"
          >
            <div className="relative flex justify-center overflow-auto">
              {/* Le navigateur ne reçoit que le rendu JPEG de cette page, jamais le PDF source complet. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pageUrl(fileUrl, pageNumber)}
                alt={`Page ${pageNumber}`}
                draggable={false}
                onLoad={() => markLoaded(pageNumber)}
                onError={() => markError(pageNumber)}
                className="select-none rounded-[0.85rem] shadow-[0_12px_30px_rgba(15,23,42,0.16)]"
                style={{
                  width: `${Math.max(80, Math.min(220, scale * 100))}%`,
                  maxWidth: "none",
                  userSelect: "none",
                  WebkitUserDrag: "none",
                }}
              />

              {watermarkText ? (
                <div
                  className="pointer-events-none absolute inset-0 grid select-none place-items-center overflow-hidden"
                  aria-hidden="true"
                >
                  <div className="-rotate-[28deg] whitespace-nowrap text-center text-lg font-black uppercase tracking-[0.28em] text-[#1f2937]/[0.10] sm:text-2xl">
                    {watermarkText}
                  </div>
                </div>
              ) : null}
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
