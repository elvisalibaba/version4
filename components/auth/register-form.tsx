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
  MailCheck,
  PenTool,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { BOOK_CATEGORIES } from "@/lib/book-categories";
import { getSafeNextPath } from "@/lib/safe-next-path";
import {
  getSupabaseBrowserConfigErrorMessage,
  getSupabaseBrowserErrorMessage,
} from "@/lib/supabase/browser-errors";
import { createClient } from "@/lib/supabase/client";
import type { AffiliateSourceType, UserRole } from "@/types/database";

type RoleOption = Exclude<UserRole, "admin">;

const inputClassName =
  "h-12 w-full rounded-2xl border border-[#eadfd4] bg-white px-4 text-base text-[#171717] outline-none transition placeholder:text-[#a79b90] focus:border-[#ff7a5c]/60 focus:ring-4 focus:ring-[#ff7a5c]/10 sm:text-sm";
const textareaClassName =
  "w-full rounded-2xl border border-[#eadfd4] bg-white px-4 py-3 text-base text-[#171717] outline-none transition placeholder:text-[#a79b90] focus:border-[#ff7a5c]/60 focus:ring-4 focus:ring-[#ff7a5c]/10 sm:text-sm";

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
        <span className="text-[0.7rem] font-bold uppercase tracking-[0.17em] text-[#6f665e]">{label}</span>
        {hint ? <span className="text-xs text-[#988b80]">{hint}</span> : null}
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
      className={`min-w-0 rounded-2xl border p-3 text-left transition sm:p-4 ${
        active
          ? "border-[#ff7a5c]/60 bg-[#fff1eb] shadow-[0_10px_25px_rgba(192,95,67,0.09)]"
          : "border-[#eadfd4] bg-white hover:border-[#d8c8ba]"
      }`}
    >
      <span className="flex items-center gap-2.5">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${active ? "bg-[#171717] text-white" : "bg-[#f6eee7] text-[#8b5d4d]"}`}>
          <Icon aria-hidden="true" className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-bold text-[#171717]">{title}</span>
          <span className="mt-0.5 block text-[0.7rem] leading-4 text-[#746a62]">{description}</span>
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
          className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-[#71675f] transition hover:bg-[#f6eee7] hover:text-[#171717]"
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
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const fullName = useMemo(() => `${firstName} ${lastName}`.trim(), [firstName, lastName]);

  useEffect(() => {
    setRole(initialRole);
  }, [initialRole]);

  function getEmailRedirectTo() {
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", safeNextPath);
    return callbackUrl.toString();
  }

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

    const configError = getSupabaseBrowserConfigErrorMessage();
    if (configError) {
      setError(configError);
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const socialLinks = buildSocialLinks({
        instagram: instagramUrl,
        x: xUrl,
        facebook: facebookUrl,
        linkedin: linkedinUrl,
      });

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: getEmailRedirectTo(),
          data: {
            name: fullName,
            role,
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
            author_profile:
              role === "author"
                ? {
                    display_name: displayName.trim(),
                    professional_headline: professionalHeadline.trim() || null,
                    bio: bio.trim() || null,
                    website: website.trim() || null,
                    location: authorLocation.trim() || null,
                    genres: authorGenres,
                    publishing_goals: publishingGoals.trim() || null,
                    social_links: socialLinks,
                  }
                : null,
          },
        },
      });

      if (signUpError) {
        setError(getSupabaseBrowserErrorMessage(signUpError, "l’inscription"));
        return;
      }

      setPassword("");
      setPasswordConfirmation("");

      if (!data.session) {
        setAwaitingConfirmation(true);
        return;
      }

      window.location.assign(safeNextPath);
    } catch (submitError) {
      setError(getSupabaseBrowserErrorMessage(submitError, "l’inscription"));
    } finally {
      setLoading(false);
    }
  }

  async function resendConfirmation() {
    setResending(true);
    setResendMessage(null);

    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: { emailRedirectTo: getEmailRedirectTo() },
      });

      setResendMessage(
        resendError
          ? getSupabaseBrowserErrorMessage(resendError, "l’envoi du lien")
          : "Un nouveau lien vient d’être envoyé.",
      );
    } catch (resendError) {
      setResendMessage(getSupabaseBrowserErrorMessage(resendError, "l’envoi du lien"));
    } finally {
      setResending(false);
    }
  }

  if (awaitingConfirmation) {
    return (
      <section className="mx-auto w-full max-w-xl rounded-[24px] border border-[#eadfd4] bg-[#fdfaf6] p-5 text-center shadow-[0_20px_60px_rgba(23,23,23,0.08)] sm:rounded-[36px] sm:p-10" aria-labelledby="registration-confirmation-title">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#fff0e9] text-[#b5533d]">
          <MailCheck aria-hidden="true" className="h-6 w-6" />
        </span>
        <h1 id="registration-confirmation-title" className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-[#171717]">
          Consultez votre email
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#6f665e]">
          Nous avons envoyé un lien de confirmation à <strong className="text-[#171717]">{email}</strong>. Ouvrez-le pour activer votre compte.
        </p>

        {resendMessage ? <p role="status" className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm text-[#5d554d]">{resendMessage}</p> : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={resendConfirmation}
            disabled={resending}
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#d9c9bc] bg-white px-4 text-sm font-semibold text-[#171717] transition hover:bg-[#f8f1eb] disabled:opacity-60"
          >
            {resending ? "Envoi en cours…" : "Renvoyer le lien"}
          </button>
          <button
            type="button"
            onClick={() => setAwaitingConfirmation(false)}
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#171717] px-4 text-sm font-semibold text-white transition hover:bg-[#332c27]"
          >
            Modifier l’adresse
          </button>
        </div>
      </section>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      aria-busy={loading}
      className="relative mx-auto w-full max-w-xl overflow-hidden rounded-[24px] border border-[#eadfd4] bg-[#fdfaf6] p-4 shadow-[0_20px_60px_rgba(23,23,23,0.08)] sm:rounded-[36px] sm:p-9 lg:p-10"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#ff7a5c]/10 blur-3xl" />

      <div className="relative">
        <header className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#f0dfd3] bg-white px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#9a583f]">
            <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
            Compte personnel
          </span>
          <div className="space-y-2">
            <h1 className="text-[1.9rem] font-semibold leading-[1.08] tracking-[-0.04em] text-[#171717] sm:text-[2.6rem]">
              Créer mon compte
            </h1>
            <p className="text-sm leading-6 text-[#6f665e]">Quelques informations suffisent pour commencer.</p>
          </div>
        </header>

        {affiliateCode ? (
          <p className="mt-5 rounded-2xl border border-[#eadfd4] bg-white px-4 py-3 text-sm leading-6 text-[#5d554d]">
            Code partenaire appliqué : <strong className="text-[#171717]">{affiliateCode}</strong>
          </p>
        ) : null}

        <div className="mt-6 grid gap-5">
          <fieldset className="grid gap-2">
            <legend className="text-[0.7rem] font-bold uppercase tracking-[0.17em] text-[#6f665e]">Je souhaite</legend>
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

          <p className="flex items-start gap-2 text-xs leading-5 text-[#7d7268]">
            <Check aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#b5533d]" />
            Utilisez au moins 8 caractères. Les deux saisies doivent être identiques.
          </p>

          {role === "author" ? (
            <div className="grid gap-4 rounded-[22px] border border-[#eadfd4] bg-white/65 p-4">
              <div>
                <h2 className="text-base font-bold text-[#171717]">Profil auteur</h2>
                <p className="mt-1 text-xs leading-5 text-[#756b62]">Votre nom public suffit pour ouvrir le studio.</p>
              </div>

              <Field id="author-display-name" label="Nom public auteur">
                <input id="author-display-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} className={inputClassName} placeholder="Nom de plume" required />
              </Field>

              <details className="group rounded-2xl border border-[#eadfd4] bg-white">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-[#302b27] marker:hidden">
                  Ajouter les détails du profil
                  <ChevronDown aria-hidden="true" className="h-4 w-4 transition-transform group-open:rotate-180" />
                </summary>
                <div className="grid gap-4 border-t border-[#eadfd4] p-4">
                  <Field id="author-headline" label="Positionnement" hint="Facultatif">
                    <input id="author-headline" value={professionalHeadline} onChange={(event) => setProfessionalHeadline(event.target.value)} className={inputClassName} placeholder="Ex. Fiction africaine contemporaine" />
                  </Field>
                  <Field id="author-bio" label="Bio courte" hint="Facultatif">
                    <textarea id="author-bio" value={bio} onChange={(event) => setBio(event.target.value)} rows={3} className={textareaClassName} placeholder="Présentez votre univers en quelques phrases." />
                  </Field>

                  <div className="grid gap-2">
                    <p className="text-[0.7rem] font-bold uppercase tracking-[0.17em] text-[#6f665e]">Genres</p>
                    <div className="flex flex-wrap gap-2">
                      {BOOK_CATEGORIES.map((category) => {
                        const active = authorGenres.includes(category);
                        return (
                          <button
                            key={category}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setAuthorGenres((previous) => toggleSelection(previous, category))}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${active ? "border-[#171717] bg-[#171717] text-white" : "border-[#eadfd4] bg-white text-[#5d554d] hover:border-[#cbb9aa]"}`}
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
          <p role="alert" aria-live="assertive" className="mt-5 rounded-2xl border border-[#f2b9aa] bg-[#fff0eb] px-4 py-3 text-sm leading-6 text-[#8f3f2e]">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="group mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#171717] px-6 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(23,23,23,0.18)] transition hover:bg-[#332c27] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Création du compte…" : role === "author" ? "Créer mon espace auteur" : "Créer mon compte lecteur"}
          {!loading ? <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" /> : null}
        </button>

        <p className="mt-4 text-center text-xs leading-5 text-[#7d7268]">
          En créant votre compte, vous acceptez nos{" "}
          <Link href="/conditions" className="font-semibold text-[#8f4b38] underline underline-offset-3">conditions d’utilisation</Link>{" "}
          et notre{" "}
          <Link href="/confidentialite" className="font-semibold text-[#8f4b38] underline underline-offset-3">politique de confidentialité</Link>.
        </p>
      </div>
    </form>
  );
}
