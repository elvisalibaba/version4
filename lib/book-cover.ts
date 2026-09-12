/** Browser-only rendering for book import forms. */
async function canvasToCover(canvas: HTMLCanvasElement): Promise<File> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => {
      if (value) resolve(value);
      else reject(new Error("Impossible de générer la couverture."));
    }, "image/png");
  });
  return new File([blob], "premiere-page.png", { type: "image/png" });
}

async function renderPdfCover(file: File): Promise<File> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const task = pdfjs.getDocument({ data: await file.arrayBuffer() });
  try {
    const document = await task.promise;
    const page = await document.getPage(1);
    const original = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({
      scale: 1200 / Math.max(original.width, original.height),
    });
    const canvas = window.document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvas, viewport, background: "white" }).promise;
    return await canvasToCover(canvas);
  } finally {
    await task.destroy();
  }
}

async function renderEpubCover(file: File): Promise<File> {
  const [{ default: ePub }, { toCanvas }] = await Promise.all([
    import("epubjs"),
    import("html-to-image"),
  ]);
  const book = ePub();
  const mount = document.createElement("div");
  mount.setAttribute("aria-hidden", "true");
  // Keep a real layout so EPUB pagination and image sizing work.
  Object.assign(mount.style, {
    position: "fixed", left: "-10000px", top: "0", width: "800px", height: "1200px",
    pointerEvents: "none",
  });
  document.body.append(mount);
  try {
    await book.open(await file.arrayBuffer(), "binary");
    const rendition = book.renderTo(mount, {
      width: 800, height: 1200, spread: "none", flow: "paginated",
      allowScriptedContent: false,
    });
    await rendition.display(0);
    const pageDocument = mount.querySelector("iframe")?.contentDocument;
    if (!pageDocument?.body) throw new Error("La première page de cet EPUB est illisible.");
    await pageDocument.fonts.ready;
    await Promise.all(Array.from(pageDocument.images, (image) => image.decode()));
    const canvas = await toCanvas(pageDocument.body, {
      width: 800, height: 1200, canvasWidth: 800, canvasHeight: 1200,
      pixelRatio: 1, backgroundColor: "#ffffff",
      style: { overflow: "hidden" },
    });
    return await canvasToCover(canvas);
  } finally {
    book.destroy();
    mount.remove();
  }
}

export async function generateBookCover(file: File): Promise<File> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "pdf") return renderPdfCover(file);
  if (extension === "epub") return renderEpubCover(file);
  throw new Error("Pour générer la couverture, importez un PDF ou un EPUB. Convertissez les fichiers MOBI avant l’import.");
}
