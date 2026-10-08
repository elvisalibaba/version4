"use client";

import { useActionState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { submitHomeContactAction, type HomeContactState } from "@/app/home/actions";
import { Button } from "@/components/ui/button";

const initialState: HomeContactState = { status: "idle", message: null };

const labelClass = "block text-sm font-semibold text-ink";
const inputClass = "mt-2 block min-h-12 w-full rounded-xl border border-line bg-white px-4 text-[0.95rem] text-ink placeholder:text-muted focus:border-brand-deep";

export function HomeContactForm({ defaultProject = "" }: { defaultProject?: string }) {
  const [state, formAction, pending] = useActionState(submitHomeContactAction, initialState);

  if (state.status === "success") {
    return (
      <div role="status" className="flex flex-col items-start gap-4 rounded-card bg-surface p-6 sm:p-8">
        <CheckCircle2 aria-hidden="true" className="h-8 w-8 text-emerald-700" />
        <p className="font-display text-xl font-bold text-ink">Demande envoyée</p>
        <p className="text-muted">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="rounded-card bg-surface p-6 sm:p-8" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className={labelClass}>Nom complet</label>
          <input id="contact-name" name="full_name" autoComplete="name" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="contact-profile" className={labelClass}>Vous êtes</label>
          <select id="contact-profile" name="profile" required defaultValue="author" className={inputClass}>
            <option value="author">Auteur</option>
            <option value="church">Église ou ministère</option>
            <option value="institution">Institution ou ONG</option>
            <option value="company">Entreprise ou dirigeant</option>
          </select>
        </div>
        <div>
          <label htmlFor="contact-email" className={labelClass}>E-mail</label>
          <input id="contact-email" name="email" type="email" autoComplete="email" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="contact-phone" className={labelClass}>Téléphone <span className="font-normal text-muted">(facultatif)</span></label>
          <input id="contact-phone" name="phone" type="tel" autoComplete="tel" className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="contact-project" className={labelClass}>Votre projet</label>
          <textarea id="contact-project" name="project" required rows={5} defaultValue={defaultProject} className={`${inputClass} py-3`} />
        </div>
      </div>
      <p aria-live="polite" className="mt-4 min-h-5 text-sm font-semibold text-red-700">{state.status === "error" ? state.message : null}</p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">En envoyant ce formulaire, vous acceptez d’être recontacté par notre équipe.</p>
        <Button type="submit" disabled={pending} className="shrink-0">
          <Send aria-hidden="true" />
          {pending ? "Envoi…" : "Envoyer ma demande"}
        </Button>
      </div>
    </form>
  );
}
