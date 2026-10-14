"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export const BULK_FORM_ID = "bulk-publish-form";

type Result = { id: string; title: string; ok: boolean; message: string };

/**
 * « Valider et publier la sélection » pour les livres ajoutés par l'équipe.
 * Les cases du tableau sont rattachées à ce formulaire par l'attribut form="bulk-publish-form".
 */
export function BulkPublishForm({ eligibleCount }: { eligibleCount: number }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [rightsReference, setRightsReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);

  function checkboxes() {
    return Array.from(document.querySelectorAll<HTMLInputElement>(`input[type=checkbox][form=${BULK_FORM_ID}]`));
  }
  function selectAll(checked: boolean) {
    for (const box of checkboxes()) box.checked = checked;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResults(null);
    const ids = new FormData(event.currentTarget).getAll("bulk").map(String);
    if (!ids.length) return setError("Cochez au moins un livre ajouté par l’équipe.");
    if (!rightsReference.trim()) return setError("La référence des droits est obligatoire pour le lot.");
    if (!window.confirm(`Valider les droits, approuver et publier ${ids.length} livre(s) avec la référence « ${rightsReference.trim()} » ?`)) return;
    setBusy(true);
    try {
      const response = await fetch("/api/admin/books/bulk-publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, rightsReference }),
      });
      const json = (await response.json()) as { message?: string; results?: Result[] };
      if (!response.ok || !json.results) throw new Error(json.message ?? "Publication groupée impossible.");
      setResults(json.results);
      selectAll(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publication groupée impossible.");
    } finally {
      setBusy(false);
    }
  }

  if (eligibleCount === 0) return null;
  const published = results?.filter((result) => result.ok).length ?? 0;

  return (
    <form id={BULK_FORM_ID} ref={formRef} onSubmit={(event) => void submit(event)}
      className="rounded-md border border-emerald-200 bg-emerald-50/60 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-[240px] flex-1 text-xs font-bold text-slate-700">
          Référence des droits pour la sélection <span className="text-red-700">*</span>
          <input value={rightsReference} onChange={(event) => setRightsReference(event.target.value)} maxLength={500}
            placeholder="Contrat, autorisation, domaine public…"
            className="mt-2 block h-11 w-full rounded-md border border-rule-strong bg-white px-3 text-base font-normal sm:text-sm" />
        </label>
        <button type="button" onClick={() => selectAll(true)} className="h-11 px-2 text-xs font-semibold text-night-900 underline">Tout cocher</button>
        <button type="button" onClick={() => selectAll(false)} className="h-11 px-2 text-xs font-semibold text-slate-600 underline">Tout décocher</button>
        <button type="submit" disabled={busy} className="h-11 rounded-sm bg-emerald-700 px-5 text-sm font-bold text-white disabled:opacity-50">
          {busy ? "Publication…" : "Valider et publier la sélection"}
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-600">{eligibleCount} livre(s) ajouté(s) par l’équipe sur cette page peuvent être publiés en lot. Les livres d’auteurs suivent le circuit de validation habituel.</p>
      {error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}
      {results ? (
        <div role="status" className="mt-3 rounded-md border border-rule bg-white p-3 text-sm">
          <p className="font-semibold text-night-900">{published} publié(s), {results.length - published} échec(s).</p>
          <ul className="mt-2 space-y-1">
            {results.map((result) => (
              <li key={result.id} className={result.ok ? "text-emerald-800" : "text-red-800"}>
                {result.ok ? "✓" : "✗"} {result.title} — {result.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </form>
  );
}
