"use client";
import { useEffect, useRef, useState } from "react";

type Props = { fileUrl: string; pageNumber: number; scale: number; onError: (message: string | null) => void };
type RenderJob = { cancel: () => void; promise: Promise<unknown> };

/** PDF.js 5 uses Promise.withResolvers, unavailable on older iOS WebKit. */
function ensurePromiseResolvers() {
  type Resolver<T> = { promise: Promise<T>; resolve: (value: T | PromiseLike<T>) => void; reject: (reason?: unknown) => void };
  const ctor = Promise as typeof Promise & { withResolvers?: <T>() => Resolver<T> };
  if (typeof ctor.withResolvers !== "function") {
    ctor.withResolvers = function <T>() {
      let resolve!: Resolver<T>["resolve"];
      let reject!: Resolver<T>["reject"];
      const promise = new Promise<T>((a, b) => { resolve = a; reject = b; });
      return { promise, resolve, reject };
    };
  }
}

/** Each request contains only ONE authorized page, never an original full PDF. */
export function SupabasePdfPage({ fileUrl, pageNumber, scale, onError }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"loading" | "rendered" | "native" | "failed">("loading");
  const [nativeUrl, setNativeUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    let render: RenderJob | null = null;
    let documentTask: { destroy: () => Promise<void> } | null = null;
    let objectUrl: string | null = null;
    setStatus("loading");
    setNativeUrl(null);
    onError(null);
    async function draw() {
      let data: Uint8Array;
      try {
        const endpoint = fileUrl + (fileUrl.includes("?") ? "&" : "?") + "page=" + pageNumber;
        const res = await fetch(endpoint, { cache: "no-store" });
        if (!res.ok) {
          if (res.status === 401) throw new Error("Connexion nécessaire pour accéder à la suite du livre.");
          throw new Error("La page n’est pas accessible pour le moment.");
        }
        const bytes = await res.arrayBuffer();
        data = new Uint8Array(bytes);
        const magic = new TextDecoder().decode(data.subarray(0, 5));
        if (magic !== "%PDF-") throw new Error("Le fichier reçu n’est pas une page PDF.");
      } catch (error) {
        if (!cancelled) { setStatus("failed"); onError(error instanceof Error ? error.message : "Page indisponible."); }
        return;
      }
      if (cancelled) return;
      try {
        ensurePromiseResolvers();
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        if (cancelled) return;
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const task = pdfjs.getDocument({ data, isEvalSupported: false, useSystemFonts: true });
        documentTask = task;
        const document = await task.promise;
        if (cancelled) return;
        const page = await document.getPage(1);
        if (cancelled) return;
        const canvas = canvasRef.current;
        if (!canvas) throw new Error("Le lecteur ne trouve pas son espace de dessin.");
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) throw new Error("Canvas non pris en charge");
        const base = page.getViewport({ scale: 1 });
        const parentWidth = Math.max(280, canvas.parentElement?.clientWidth ?? 700);
        const fitWidth = Math.min(parentWidth, 1100) * Math.max(0.8, Math.min(1.6, scale));
        const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
        const viewport = page.getViewport({ scale: (fitWidth / base.width) * pixelRatio });
        // Avoid memory errors on mobile Safari (maximum ~4 megapixels).
        const pixelCap = Math.min(1, Math.sqrt(4_000_000 / (viewport.width * viewport.height)));
        const finalViewport = pixelCap < 1 ? page.getViewport({ scale: (fitWidth / base.width) * pixelRatio * pixelCap }) : viewport;
        canvas.width = Math.ceil(finalViewport.width);
        canvas.height = Math.ceil(finalViewport.height);
        canvas.style.width = `${canvas.width / pixelRatio}px`;
        canvas.style.height = "auto";
        const job = page.render({ canvas, canvasContext: context, viewport: finalViewport });
        render = job;
        await job.promise;
        if (!cancelled) setStatus("rendered");
      } catch {
        // Native single-page PDF is a last-resort fallback for incompatible browsers.
        if (!cancelled) {
          objectUrl = URL.createObjectURL(new Blob([new Uint8Array(data)], { type: "application/pdf" }));
          setNativeUrl(objectUrl);
          setStatus("native");
        }
      }
    }
    void draw();
    return () => {
      cancelled = true;
      render?.cancel();
      void documentTask?.destroy().catch(() => undefined);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileUrl, pageNumber, scale, onError]);
  return (
    <div className="relative flex min-h-[280px] w-full flex-col items-center justify-start bg-white">
      {status === "loading" ? <p role="status" className="p-8 text-sm text-slate-600">Ouverture de la page {pageNumber}…</p> : null}
      <canvas ref={canvasRef} aria-label={`Page PDF ${pageNumber}`} className={status === "rendered" ? "block max-w-full bg-white shadow" : "hidden"} />
      {status === "native" && nativeUrl ? (
        <div className="flex w-full flex-col gap-3">
          <p className="px-3 pt-3 text-center text-xs text-slate-600">Affichage compatible avec votre navigateur</p>
          <iframe title={`Page PDF ${pageNumber}`} src={nativeUrl + "#toolbar=0&navpanes=0"} className="h-[78dvh] min-h-[460px] w-full border-0 bg-white" />
          <a href={nativeUrl} target="_blank" rel="noopener noreferrer" className="px-3 pb-4 text-center text-sm font-semibold underline">
            Ouvrir cette page dans le lecteur du téléphone
          </a>
        </div>
      ) : null}
      {status === "failed" ? <p className="p-5 text-sm text-red-700">Impossible d’afficher cette page. Réessayez ou ouvrez un autre livre.</p> : null}
    </div>
  );
}
