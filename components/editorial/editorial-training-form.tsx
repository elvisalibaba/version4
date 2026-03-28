"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import {
  editorialTrainingExperienceLevelOptions,
  editorialTrainingPreferredFormatOptions,
  editorialTrainingProfileTypeOptions,
  editorialTrainingProjectStageOptions,
} from "@/lib/editorial-training";
import { FormSection } from "@/components/ui/form-section";
import {
  initialEditorialTrainingFormState,
  submitEditorialTrainingRequestAction,
} from "@/app/formation-editoriale/actions";

type EditorialTrainingFormProps = {
  initialValues?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    country?: string | null;
    city?: string | null;
  };
};

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-900">{label}</span>
      {children}
      {hint ? (
        <span className="text-xs leading-5 text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="cta-primary px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Envoi en cours..." : "Envoyer ma demande"}
    </button>
  );
}

export function EditorialTrainingForm({
  initialValues,
}: EditorialTrainingFormProps) {
  const [state, formAction] = useActionState(
    submitEditorialTrainingRequestAction,
    initialEditorialTrainingFormState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <input type="hidden" name="source" value="footer-formation-editoriale" />
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
      />

      <FormSection
        title="Coordonnees"
        description="Partagez vos informations principales pour que l equipe puisse vous recontacter."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Prenom *">
            <input
              type="text"
              name="first_name"
              required
              defaultValue={initialValues?.firstName ?? ""}
              className="w-full px-4 py-3.5 text-slate-900"
            />
          </Field>
          <Field label="Nom *">
            <input
              type="text"
              name="last_name"
              required
              defaultValue={initialValues?.lastName ?? ""}
              className="w-full px-4 py-3.5 text-slate-900"
            />
          </Field>
          <Field label="Email *">
            <input
              type="email"
              name="email"
              required
              defaultValue={initialValues?.email ?? ""}
              className="w-full px-4 py-3.5 text-slate-900"
            />
          </Field>
          <Field label="Telephone">
            <input
              type="tel"
              name="phone"
              defaultValue={initialValues?.phone ?? ""}
              className="w-full px-4 py-3.5 text-slate-900"
            />
          </Field>
          <Field label="Pays">
            <input
              type="text"
              name="country"
              defaultValue={initialValues?.country ?? ""}
              className="w-full px-4 py-3.5 text-slate-900"
            />
          </Field>
          <Field label="Ville">
            <input
              type="text"
              name="city"
              defaultValue={initialValues?.city ?? ""}
              className="w-full px-4 py-3.5 text-slate-900"
            />
          </Field>
          <div className="md:col-span-2">
            <Field
              label="Organisation / structure"
              hint="Maison d edition, studio, marque personnelle ou entreprise."
            >
              <input
                type="text"
                name="organization_name"
                className="w-full px-4 py-3.5 text-slate-900"
              />
            </Field>
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Profil"
        description="Aidez-nous a vous orienter vers le bon niveau et le bon format de formation."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Profil *">
            <select
              name="profile_type"
              required
              defaultValue=""
              className="w-full px-4 py-3.5 text-slate-900"
            >
              <option value="" disabled>
                Selectionnez votre profil
              </option>
              {editorialTrainingProfileTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Niveau actuel *">
            <select
              name="experience_level"
              required
              defaultValue=""
              className="w-full px-4 py-3.5 text-slate-900"
            >
              <option value="" disabled>
                Selectionnez votre niveau
              </option>
              {editorialTrainingExperienceLevelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Stade du projet *">
            <select
              name="project_stage"
              required
              defaultValue=""
              className="w-full px-4 py-3.5 text-slate-900"
            >
              <option value="" disabled>
                Selectionnez le stade du projet
              </option>
              {editorialTrainingProjectStageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Format souhaite *">
            <select
              name="preferred_format"
              required
              defaultValue=""
              className="w-full px-4 py-3.5 text-slate-900"
            >
              <option value="" disabled>
                Selectionnez le format souhaite
              </option>
              {editorialTrainingPreferredFormatOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </FormSection>

      <FormSection
        title="Besoin editorial"
        description="Decrivez votre objectif principal afin que l accompagnement soit pertinent des le premier contact."
      >
        <div className="grid gap-5">
          <Field
            label="Objectifs de formation *"
            hint="Exemple: structurer un manuscrit, comprendre la chaine editoriale, lancer un catalogue."
          >
            <textarea
              name="objectives"
              required
              rows={5}
              className="w-full px-4 py-3.5 text-slate-900"
            />
          </Field>
          <Field
            label="Message complementaire"
            hint="Partagez ici votre contexte, vos contraintes ou vos attentes specifiques."
          >
            <textarea
              name="message"
              rows={4}
              className="w-full px-4 py-3.5 text-slate-900"
            />
          </Field>
          <label className="flex items-start gap-3 rounded-[1.35rem] border border-[#ece3d7] bg-[#fcfaf7] px-4 py-4 text-sm leading-6 text-slate-700">
            <input
              type="checkbox"
              name="consent_to_contact"
              required
              className="mt-1 h-4 w-4 rounded border-slate-300"
            />
            <span>
              J accepte d etre contacte par Holistique Books au sujet de cette
              formation editoriale.
            </span>
          </label>
        </div>
      </FormSection>

      {state.message ? (
        <div
          className={`rounded-[1.4rem] border px-4 py-4 text-sm ${
            state.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-[#ece3d7] bg-white/90 px-5 py-4">
        <p className="max-w-2xl text-sm leading-6 text-slate-500">
          Votre demande est enregistree dans l espace admin et peut etre
          exportee en CSV pour le suivi editorial.
        </p>
        <SubmitButton />
      </div>
    </form>
  );
}
