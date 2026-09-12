"use client";

import { startTransition, useRef, useState, type ReactNode } from "react";
import { unstable_rethrow } from "next/navigation";
import { createAdminBooksAction } from "@/app/admin/actions";
import { generateBookCover } from "@/lib/book-cover";

export function AdminBookImportForm({ children }: { children: ReactNode }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);

  async function publish(formData: FormData) {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      for (let index = 0; index < 5; index += 1) {
        const title = String(formData.get(`title_${index}`) ?? "").trim();
        const authorId = String(formData.get(`author_id_${index}`) ?? "").trim();
        const file = formData.get(`ebook_file_${index}`);
        const hasFile = file instanceof File && file.size > 0;
        if (!title && !authorId && !hasFile) continue;
        if (!title || !authorId || !hasFile) {
          throw new Error(`Livre ${index + 1} : renseignez le titre, l’auteur et le fichier numérique.`);
        }
        setStatus(`Génération de la couverture du livre ${index + 1}…`);
        try {
          formData.set(`generated_cover_${index}`, await generateBookCover(file));
        } catch (cause) {
          throw new Error(`Livre ${index + 1} (${title}) : ${cause instanceof Error ? cause.message : "impossible de lire la première page."}`);
        }
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible de préparer les livres.");
      setBusy(false);
      submitting.current = false;
      setStatus("");
      return;
    }

    setStatus("Publication des livres…");
    // Keep redirects outside the preparation error handler.
    try {
      await createAdminBooksAction(formData);
    } catch (cause) {
      unstable_rethrow(cause);
      setError("La publication a échoué. Vérifiez votre connexion puis réessayez.");
    } finally {
      setBusy(false);
      submitting.current = false;
      setStatus("");
    }
  }

  return <form onSubmit={(event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => publish(formData));
  }} encType="multipart/form-data" className="space-y-4" aria-busy={busy}>
    {error ? <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}
    {busy ? <div role="status" className="rounded-2xl bg-[#effaf4] px-4 py-3 text-sm font-semibold text-[#266347]"><p>{status}</p><progress aria-label={status} className="mt-3 h-2 w-full accent-[#173d2c]" /></div> : null}
    <fieldset disabled={busy} className="min-w-0 space-y-4 disabled:opacity-60">{children}</fieldset>
  </form>;
}
