"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  PenTool,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { BOOK_CATEGORIES } from "@/lib/book-categories";
import { getSafeNextPath } from "@/lib/safe-next-path";
import type { AffiliateSourceType, UserRole } from "@/types/api";

type RoleOption = Exclude<UserRole, "admin">;

const inputClassName =
  "h-12 w-full rounded-md border border-rule bg-white px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-brand-600/60 focus:ring-4 focus:ring-brand-600/10 sm:text-sm";
const textareaClassName =
  "w-full rounded-md border border-rule bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-brand-600/60 focus:ring-4 focus:ring-brand-600/10 sm:text-sm";

function toggleSelection(values: string[], value: string) {
  return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
}

function buildSocialLinks(input: Record<string, string>) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value.trim().length > 0));
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="grid gap-2" htmlFor={id}>
      <span className="flex items-center justify-between gap-3">
        <span className="text-[0.7rem] font-bold text-slate-600">{label}</span>
        {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

function RoleChoice({ active, icon: Icon, title, description, onClick }: {
  active: boolean;
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`min-w-0 rounded-md border p-3 text-left transition sm:p-4 ${
        active
          ? "border-brand-600/60 bg-paper "
          : "border-rule bg-white hover:border-rule-strong"
      }`}
    >
      <span className="flex items-center gap-2.5">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${active ? "bg-night-900 text-white" : "bg-paper-deep text-slate-600"}`}>
          <Icon aria-hidden="true" className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-bold text-slate-900">{title}</span>
          <span className="mt-0.5 block text-[0.7rem] leading-4 text-slate-600">{description}</span>
        </span>
      </span>
    </button>
  );
}

function PasswordField({ id, label, value, onChange, visible, onToggle, autoComplete }: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  autoComplete: "new-password";
}) {
  return (
    <Field id={id} label={label}>
      <span className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClassName} pr-12`}
          autoComplete={autoComplete}
          minLength={8}
          required
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-slate-600 transition hover:bg-paper-deep hover:text-slate-900"
          aria-label={visible ? `Masquer ${label.toLowerCase()}` : `Afficher ${label.toLowerCase()}`}
          aria-pressed={visible}
        >
          {visible ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
        </button>
      </span>
    </Field>
  );
}

type RegisterFormProps = {
  initialRole?: RoleOption;
  affiliateCode?: string | null;
  affiliateSourceType?: AffiliateSourceType | null;
  affiliateSourceBookId?: string | null;
  affiliateSourcePlanId?: string | null;
  nextPath: string;
};

export function RegisterForm({
  initialRole = "reader",
  affiliateCode = null,
  affiliateSourceType = null,
  affiliateSourceBookId = null,
  affiliateSourcePlanId = null,
  nextPath,
}: RegisterFormProps) {
  const safeNextPath = getSafeNextPath(nextPath);
  const [role, setRole] = useState<RoleOption>(initialRole);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [professionalHeadline, setProfessionalHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [authorLocation, setAuthorLocation] = useState("");
  const [authorGenres, setAuthorGenres] = useState<string[]>([]);
  const [publishingGoals, setPublishingGoals] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [xUrl, setXUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fullName = useMemo(() => `${firstName} ${lastName}`.trim(), [firstName, lastName]);

  useEffect(() => {
    setRole(initialRole);
  }, [initialRole]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError("Renseignez votre prénom et votre nom pour continuer.");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      setLoading(false);
      return;
    }

    if (password !== passwordConfirmation) {
      setError("Les deux mots de passe ne correspondent pas.");
      setLoading(false);
      return;
    }

    if (role === "author" && !displayName.trim()) {
      setError("Ajoutez votre nom public pour créer votre espace auteur.");
      setLoading(false);
      return;
    }


    try {
      const socialLinks = buildSocialLinks({
        instagram: instagramUrl,
        x: xUrl,
        facebook: facebookUrl,
        linkedin: linkedinUrl,
      });

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          password_confirmation: passwordConfirmation,
          role,
          name: fullName,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: null,
          country: null,
          city: null,
          preferred_language: "fr",
          favorite_categories: [],
          marketing_opt_in: false,
          referred_by_affiliate_code: affiliateCode,
          affiliate_source_type: affiliateSourceType,
          affiliate_source_book_id: affiliateSourceBookId,
          affiliate_source_plan_id: affiliateSourcePlanId,
          display_name: role === "author" ? displayName.trim() : null,
          professional_headline: role === "author" ? professionalHeadline.trim() || null : null,
          bio: role === "author" ? bio.trim() || null : null,
          website: role === "author" ? website.trim() || null : null,
          location: role === "author" ? authorLocation.trim() || null : null,
          genres: role === "author" ? authorGenres : [],
          publishing_goals: role === "author" ? publishingGoals.trim() || null : null,
          social_links: role === "author" ? socialLinks : {},
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const firstValidationError = payload?.errors
          ? Object.values(payload.errors).flat().find((value) => typeof value === "string")
          : null;
        setError((firstValidationError as string | null) ?? payload?.message ?? "Inscription impossible.");
        return;
      }

      setPassword("");
      setPasswordConfirmation("");

      if (payload?.verification_required && payload?.email) {
        const params = new URLSearchParams({ email: payload.email, next: safeNextPath });
        window.location.assign(`/verify-email?${params.toString()}`);
        return;
      }

      window.location.assign(safeNextPath);
    } catch {
      setError("Le service d’inscription est momentanément indisponible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      aria-busy={loading}
      className="relative mx-auto w-full max-w-xl overflow-hidden rounded-md border border-rule bg-paper p-4 sm:rounded-md sm:p-9 lg:p-10"
    >

      <div className="relative">
        <header className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-sm border border-rule bg-white px-3 py-1.5 text-xs font-bold text-brand-600">
            <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
            Compte personnel
          </span>
          <div className="space-y-2">
            <h1 className="text-[1.9rem] font-semibold leading-[1.08] tracking-[-0.04em] text-slate-900 sm:text-[2.6rem]">
              Créer mon compte
            </h1>
            <p className="text-sm leading-6 text-slate-600">Quelques informations suffisent pour commencer.</p>
          </div>
        </header>

        {affiliateCode ? (
          <p className="mt-5 rounded-md border border-rule bg-white px-4 py-3 text-sm leading-6 text-slate-600">
            Code partenaire appliqué : <strong className="text-slate-900">{affiliateCode}</strong>
          </p>
        ) : null}

        <div className="mt-6 grid gap-5">
          <fieldset className="grid gap-2">
            <legend className="text-[0.7rem] font-bold text-slate-600">Je souhaite</legend>
            <div role="radiogroup" aria-label="Type de compte" className="grid grid-cols-2 gap-2.5">
              <RoleChoice active={role === "reader"} icon={BookOpen} title="Lire" description="Compte lecteur" onClick={() => setRole("reader")} />
              <RoleChoice active={role === "author"} icon={PenTool} title="Publier" description="Espace auteur" onClick={() => setRole("author")} />
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="register-first-name" label="Prénom">
              <input id="register-first-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} className={inputClassName} autoComplete="given-name" required />
            </Field>
            <Field id="register-last-name" label="Nom">
              <input id="register-last-name" value={lastName} onChange={(event) => setLastName(event.target.value)} className={inputClassName} autoComplete="family-name" required />
            </Field>
          </div>

          <Field id="register-email" label="Adresse email">
            <input id="register-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClassName} autoComplete="email" autoCapitalize="none" inputMode="email" placeholder="nom@domaine.com" required />
          </Field>

          <PasswordField id="register-password" label="Mot de passe" value={password} onChange={setPassword} visible={passwordVisible} onToggle={() => setPasswordVisible((visible) => !visible)} autoComplete="new-password" />
          <PasswordField id="register-password-confirmation" label="Confirmer le mot de passe" value={passwordConfirmation} onChange={setPasswordConfirmation} visible={confirmationVisible} onToggle={() => setConfirmationVisible((visible) => !visible)} autoComplete="new-password" />

          <p className="flex items-start gap-2 text-xs leading-5 text-slate-600">
            <Check aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
            Utilisez au moins 8 caractères. Les deux saisies doivent être identiques.
          </p>

          {role === "author" ? (
            <div className="grid gap-4 rounded-md border border-rule bg-white/65 p-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Profil auteur</h2>
                <p className="mt-1 text-xs leading-5 text-slate-600">Votre nom public suffit pour ouvrir le studio.</p>
              </div>

              <Field id="author-display-name" label="Nom public auteur">
                <input id="author-display-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} className={inputClassName} placeholder="Nom de plume" required />
              </Field>

              <details className="group rounded-md border border-rule bg-white">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-slate-800 marker:hidden">
                  Ajouter les détails du profil
                  <ChevronDown aria-hidden="true" className="h-4 w-4 transition-transform group-open:rotate-180" />
                </summary>
                <div className="grid gap-4 border-t border-rule p-4">
                  <Field id="author-headline" label="Positionnement" hint="Facultatif">
                    <input id="author-headline" value={professionalHeadline} onChange={(event) => setProfessionalHeadline(event.target.value)} className={inputClassName} placeholder="Ex. Fiction africaine contemporaine" />
                  </Field>
                  <Field id="author-bio" label="Bio courte" hint="Facultatif">
                    <textarea id="author-bio" value={bio} onChange={(event) => setBio(event.target.value)} rows={3} className={textareaClassName} placeholder="Présentez votre univers en quelques phrases." />
                  </Field>

                  <div className="grid gap-2">
                    <p className="text-[0.7rem] font-bold text-slate-600">Genres</p>
                    <div className="flex flex-wrap gap-2">
                      {BOOK_CATEGORIES.map((category) => {
                        const active = authorGenres.includes(category);
                        return (
                          <button
                            key={category}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setAuthorGenres((previous) => toggleSelection(previous, category))}
                            className={`rounded-sm border px-3 py-1.5 text-xs font-semibold transition ${active ? "border-night-900 bg-night-900 text-white" : "border-rule bg-white text-slate-600 hover:border-slate-400"}`}
                          >
                            {category}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field id="author-website" label="Site web" hint="Facultatif">
                      <input id="author-website" type="url" value={website} onChange={(event) => setWebsite(event.target.value)} className={inputClassName} placeholder="https://…" />
                    </Field>
                    <Field id="author-location" label="Localisation" hint="Facultatif">
                      <input id="author-location" value={authorLocation} onChange={(event) => setAuthorLocation(event.target.value)} className={inputClassName} placeholder="Ville, pays" />
                    </Field>
                  </div>

                  <Field id="author-goals" label="Objectifs de publication" hint="Facultatif">
                    <textarea id="author-goals" value={publishingGoals} onChange={(event) => setPublishingGoals(event.target.value)} rows={3} className={textareaClassName} />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field id="author-instagram" label="Instagram" hint="Facultatif"><input id="author-instagram" type="url" value={instagramUrl} onChange={(event) => setInstagramUrl(event.target.value)} className={inputClassName} placeholder="https://…" /></Field>
                    <Field id="author-x" label="X / Twitter" hint="Facultatif"><input id="author-x" type="url" value={xUrl} onChange={(event) => setXUrl(event.target.value)} className={inputClassName} placeholder="https://…" /></Field>
                    <Field id="author-facebook" label="Facebook" hint="Facultatif"><input id="author-facebook" type="url" value={facebookUrl} onChange={(event) => setFacebookUrl(event.target.value)} className={inputClassName} placeholder="https://…" /></Field>
                    <Field id="author-linkedin" label="LinkedIn" hint="Facultatif"><input id="author-linkedin" type="url" value={linkedinUrl} onChange={(event) => setLinkedinUrl(event.target.value)} className={inputClassName} placeholder="https://…" /></Field>
                  </div>
                </div>
              </details>
            </div>
          ) : null}
        </div>

        {error ? (
          <p role="alert" aria-live="assertive" className="mt-5 rounded-md border border-brand-200 bg-paper px-4 py-3 text-sm leading-6 text-brand-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="group mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-sm bg-night-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Création du compte…" : role === "author" ? "Créer mon espace auteur" : "Créer mon compte lecteur"}
          {!loading ? <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" /> : null}
        </button>

        <p className="mt-4 text-center text-xs leading-5 text-slate-600">
          En créant votre compte, vous acceptez nos{" "}
          <Link href="/conditions" className="font-semibold text-brand-700 underline underline-offset-3">conditions d’utilisation</Link>{" "}
          et notre{" "}
          <Link href="/confidentialite" className="font-semibold text-brand-700 underline underline-offset-3">politique de confidentialité</Link>.
        </p>
      </div>
    </form>
  );
}
