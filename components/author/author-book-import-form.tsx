"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PublishLabForm, type PublishLabFormHandle, type PublishLabFormProps, type SubmissionIntent } from "@/components/author/publish-lab-form";
import { MAX_AUTHOR_BOOKS_PER_SUBMISSION } from "@/lib/publish-lab";

export function AuthorBookImportForm(props: Pick<PublishLabFormProps, "subscriptionPlans" | "initialValues">) {
  const router = useRouter();
  const forms = useRef<Array<PublishLabFormHandle | null>>([]);
  const submitting = useRef(false);
  const [count, setCount] = useState(1);
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);
  const [completed, setCompleted] = useState<number[]>([]);
  const [intent, setIntent] = useState<SubmissionIntent | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveBooks(nextIntent: SubmissionIntent) {
    if (submitting.current) return;
    setError(null);
    // Validate every selected book before uploading any file.
    for (let index = 0; index < count; index += 1) {
      if (completed.includes(index)) continue;
      if (!forms.current[index]?.validate()) {
        setActive(index);
        setError(`Vérifiez les informations du livre ${index + 1}.`);
        return;
      }
    }
    submitting.current = true;
    setBusy(true);
    setIntent(nextIntent);
    try {
      for (let index = 0; index < count; index += 1) {
        if (completed.includes(index)) continue;
        setActive(index);
        const saved = await forms.current[index]?.save(nextIntent);
        if (!saved) {
          setError(`Le livre ${index + 1} n’a pas pu être enregistré. Les livres déjà enregistrés sont conservés ; réessayez pour poursuivre.`);
          return;
        }
        setCompleted((previous) => [...previous, index]);
      }
      router.push("/dashboard/author/books");
      router.refresh();
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return <div className="space-y-6" aria-busy={busy}>
    <div className="rounded-2xl border border-[#ded3c2] bg-[#fffaf2] p-4">
      <p className="text-sm font-semibold text-[#173d2c]">Jusqu’à {MAX_AUTHOR_BOOKS_PER_SUBMISSION} livres par envoi, sans image de couverture supplémentaire.</p>
      <div className="mt-4 flex flex-wrap gap-2" aria-label="Livres à envoyer">
        {Array.from({ length: count }, (_, index) => <button key={index} type="button" disabled={busy} aria-pressed={active === index} onClick={() => setActive(index)} className={`rounded-full border px-4 py-2 text-sm font-bold disabled:opacity-60 ${active === index ? "border-[#173d2c] bg-[#173d2c] text-white" : "border-[#ded3c2] bg-white text-[#173d2c]"}`}>Livre {index + 1}{completed.includes(index) ? " ✓" : ""}</button>)}
        {count < MAX_AUTHOR_BOOKS_PER_SUBMISSION && completed.length === 0 ? <button type="button" disabled={busy} onClick={() => { setCount((value) => value + 1); setActive(count); }} className="rounded-full border border-dashed border-[#173d2c] px-4 py-2 text-sm font-bold text-[#173d2c] disabled:opacity-60">+ Ajouter un livre</button> : null}
        {count > 1 && completed.length === 0 ? <button type="button" disabled={busy} onClick={() => { setCount((value) => value - 1); setActive((value) => Math.min(value, count - 2)); }} className="rounded-full px-4 py-2 text-sm text-slate-600 disabled:opacity-60">Retirer le dernier livre</button> : null}
      </div>
    </div>

    {busy || completed.length > 0 ? <div role="status" className="rounded-2xl bg-[#effaf4] px-4 py-3 text-sm font-semibold text-[#266347]"><p>{busy ? `Traitement du livre ${active + 1} sur ${count}…` : "Envoi interrompu."} {completed.length} sur {count} enregistré{completed.length > 1 ? "s" : ""}.</p><progress aria-label="Livres enregistrés" value={completed.length} max={count} className="mt-3 h-2 w-full accent-[#173d2c]" /></div> : null}
    {error ? <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}

    <fieldset disabled={busy} className="min-w-0">
      {Array.from({ length: count }, (_, index) => <div key={index} hidden={active !== index}>
        <PublishLabForm {...props} batchMode disabled={completed.includes(index)} ref={(handle) => { forms.current[index] = handle; }} />
      </div>)}
    </fieldset>

    <div className="sticky bottom-3 flex flex-wrap justify-end gap-3 rounded-2xl border border-[#ded3c2] bg-[#fffaf2]/95 p-3 shadow-lg backdrop-blur">
      <button type="button" disabled={busy || (completed.length > 0 && intent !== "draft")} onClick={() => void saveBooks("draft")} className="cta-secondary px-6 py-3 text-sm disabled:opacity-50">{busy && intent === "draft" ? "Enregistrement…" : "Enregistrer en brouillon"}</button>
      <button type="button" disabled={busy || (completed.length > 0 && intent !== "submit")} onClick={() => void saveBooks("submit")} className="cta-primary px-6 py-3 text-sm disabled:opacity-50">{busy && intent === "submit" ? "Envoi en cours…" : completed.length > 0 ? "Reprendre l’envoi" : `Envoyer ${count} livre${count > 1 ? "s" : ""} pour publication`}</button>
    </div>
  </div>;
}
