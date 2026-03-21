"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronDown, PenTool, ShieldCheck, type LucideIcon } from "lucide-react";
import { BOOK_CATEGORIES } from "@/lib/book-categories";
import { getSupabaseBrowserConfigErrorMessage, getSupabaseBrowserErrorMessage } from "@/lib/supabase/browser-errors";
import { createClient } from "@/lib/supabase/client";
import type { AffiliateSourceType, UserRole } from "@/types/database";

type RoleOption = Exclude<UserRole, "admin">;

const inputClassName =
  "h-11 w-full rounded-lg border border-[#a6a6a6] bg-white px-3 text-sm text-[#0f1111] outline-none transition placeholder:text-[#6b7280] focus:border-[#e77600] focus:ring-2 focus:ring-[#fbd8a5]";

const textareaClassName =
  "w-full rounded-lg border border-[#a6a6a6] bg-white px-3 py-2.5 text-sm text-[#0f1111] outline-none transition placeholder:text-[#6b7280] focus:border-[#e77600] focus:ring-2 focus:ring-[#fbd8a5]";

function toggleSelection(values: string[], value: string) {
  return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
}

function buildSocialLinks(input: Record<string, string>) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value.trim().length > 0));
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium text-[#0f1111]">{label}</span>
      {children}
      {hint ? <span className="text-xs leading-5 text-[#565959]">{hint}</span> : null}
    </label>
  );
}

function SectionCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#d5d9d9] bg-white p-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-[#0f1111]">{title}</h2>
        {hint ? <p className="text-sm leading-6 text-[#565959]">{hint}</p> : null}
      </div>
      <div className="mt-4 grid gap-4">{children}</div>
    </section>
  );
}

function RoleCard({
  active,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition ${
        active
          ? "border-[#f3a847] bg-[#fff8e8] shadow-sm"
          : "border-[#d5d9d9] bg-white hover:border-[#c7cccc] hover:bg-[#fcfcfc]"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${
            active ? "bg-[#232f3e] text-white" : "bg-[#f7fafa] text-[#232f3e]"
          }`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[#0f1111]">{title}</p>
          <p className="text-sm leading-6 text-[#565959]">{description}</p>
        </div>
      </div>
    </button>
  );
}

function CategoryChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "border-[#232f3e] bg-[#232f3e] text-white"
          : "border-[#d5d9d9] bg-white text-[#374151] hover:border-[#c7cccc] hover:bg-[#f7fafa]"
      }`}
    >
      {label}
    </button>
  );
}

type RegisterFormProps = {
  initialRole?: RoleOption;
  affiliateCode?: string | null;
  affiliateSourceType?: AffiliateSourceType | null;
  affiliateSourceBookId?: string | null;
  affiliateSourcePlanId?: string | null;
};

export function RegisterForm({
  initialRole = "reader",
  affiliateCode = null,
  affiliateSourceType = null,
  affiliateSourceBookId = null,
  affiliateSourcePlanId = null,
}: RegisterFormProps) {
  const [role, setRole] = useState<RoleOption>(initialRole);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("fr");
  const [favoriteCategories, setFavoriteCategories] = useState<string[]>([]);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
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
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fullName = useMemo(() => `${firstName} ${lastName}`.trim(), [firstName, lastName]);

  useEffect(() => {
    setRole(initialRole);
  }, [initialRole]);

  function getEmailRedirectTo() {
    const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
    const baseUrl = configuredUrl && configuredUrl.length > 0 ? configuredUrl.replace(/\/$/, "") : window.location.origin;
    return `${baseUrl}/auth/callback?next=${encodeURIComponent("/dashboard")}`;
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError("Renseigne le prenom et le nom pour continuer.");
      setLoading(false);
      return;
    }

    if (password.trim().length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caracteres.");
      setLoading(false);
      return;
    }

    if (role === "author" && !displayName.trim()) {
      setError("Ajoute ton nom public auteur pour activer le studio.");
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
        email,
        password,
        options: {
          emailRedirectTo: getEmailRedirectTo(),
          data: {
            name: fullName,
            role,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: phone.trim() || null,
            country: country.trim() || null,
            city: city.trim() || null,
            preferred_language: preferredLanguage,
            favorite_categories: favoriteCategories,
            marketing_opt_in: marketingOptIn,
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
        setError(getSupabaseBrowserErrorMessage(signUpError, "l inscription"));
        return;
      }

      if (!data.session) {
        setSuccess("Compte cree. Verifie ton email puis reviens sur la plateforme pour activer ton espace.");
        return;
      }

      window.location.assign("/dashboard");
    } catch (submitError) {
      setError(getSupabaseBrowserErrorMessage(submitError, "l inscription"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-[#d5d9d9] bg-white p-5 shadow-sm sm:p-6">
      <div className="space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#232f3e] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
          <ShieldCheck className="h-3.5 w-3.5" />
          {role === "author" ? "Inscription auteur" : "Inscription lecteur"}
        </span>
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[#0f1111]">Creer votre compte</h1>
          <p className="text-sm leading-6 text-[#565959]">
            Renseignez les informations principales. Les details optionnels peuvent etre ajoutes ensuite.
          </p>
        </div>
        {affiliateCode ? (
          <div className="rounded-xl border border-[#d5d9d9] bg-[#f7fafa] px-4 py-3 text-sm leading-6 text-[#374151]">
            Code affiliation applique : <span className="font-semibold text-[#0f1111]">{affiliateCode}</span>
            {affiliateSourceType === "book" ? " depuis un livre partage." : null}
            {affiliateSourceType === "plan" ? " depuis un paquet partage." : null}
          </div>
        ) : null}
      </div>

      <div className="mt-6 space-y-4">
        <SectionCard title="Type de compte" hint="Choisissez le parcours qui correspond a votre usage principal.">
          <div className="grid gap-3">
            <RoleCard
              active={role === "reader"}
              icon={BookOpen}
              title="Lecteur"
              description="Pour acheter, lire, gerer votre bibliotheque et acceder au lecteur web."
              onClick={() => setRole("reader")}
            />
            <RoleCard
              active={role === "author"}
              icon={PenTool}
              title="Auteur"
              description="Pour publier, administrer vos livres et retrouver votre espace auteur."
              onClick={() => setRole("author")}
            />
          </div>
        </SectionCard>

        <SectionCard title="Informations du compte" hint="Ce sont les seules informations necessaires pour demarrer.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Prenom">
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className={inputClassName}
                autoComplete="given-name"
                required
              />
            </Field>
            <Field label="Nom">
              <input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className={inputClassName}
                autoComplete="family-name"
                required
              />
            </Field>
          </div>

          <Field label="Adresse email">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClassName}
              autoComplete="email"
              placeholder="nom@domaine.com"
              required
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
            <Field label="Mot de passe" hint="Minimum 8 caracteres.">
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClassName}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </Field>
            <Field label="Langue">
              <select value={preferredLanguage} onChange={(event) => setPreferredLanguage(event.target.value)} className={inputClassName}>
                <option value="fr">Francais</option>
                <option value="en">Anglais</option>
                <option value="es">Espagnol</option>
              </select>
            </Field>
          </div>
        </SectionCard>

        {role === "author" ? (
          <SectionCard title="Base du profil auteur" hint="Ces champs servent a ouvrir proprement votre espace auteur.">
            <div className="rounded-lg border border-[#f3a847] bg-[#fff8e8] px-4 py-3 text-sm leading-6 text-[#5c3b00]">
              Le nom public auteur est requis pour activer votre profil et votre studio.
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom public auteur">
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className={inputClassName}
                  placeholder="Nom de plume ou marque auteur"
                  required
                />
              </Field>
              <Field label="Positionnement" hint="Optionnel">
                <input
                  value={professionalHeadline}
                  onChange={(event) => setProfessionalHeadline(event.target.value)}
                  className={inputClassName}
                  placeholder="Ex: Fiction africaine contemporaine"
                />
              </Field>
            </div>

            <Field label="Bio courte" hint="Optionnel">
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                rows={4}
                className={textareaClassName}
                placeholder="Deux ou trois phrases pour presenter votre univers."
              />
            </Field>

            <div className="space-y-2">
              <p className="text-sm font-medium text-[#0f1111]">Genres</p>
              <p className="text-xs leading-5 text-[#565959]">Selectionnez les categories les plus proches de votre catalogue.</p>
              <div className="flex flex-wrap gap-2">
                {BOOK_CATEGORIES.map((category) => {
                  const active = authorGenres.includes(category);
                  return (
                    <CategoryChip
                      key={`author-${category}`}
                      active={active}
                      label={category}
                      onClick={() => setAuthorGenres((previous) => toggleSelection(previous, category))}
                    />
                  );
                })}
              </div>
            </div>

            <details className="rounded-lg border border-[#d5d9d9] bg-[#f7fafa]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-semibold text-[#0f1111] marker:hidden">
                Ajouter des details auteur
                <ChevronDown className="h-4 w-4 text-[#565959]" />
              </summary>
              <div className="grid gap-4 border-t border-[#d5d9d9] px-4 py-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Site web">
                    <input
                      value={website}
                      onChange={(event) => setWebsite(event.target.value)}
                      className={inputClassName}
                      placeholder="https://..."
                    />
                  </Field>
                  <Field label="Localisation">
                    <input
                      value={authorLocation}
                      onChange={(event) => setAuthorLocation(event.target.value)}
                      className={inputClassName}
                      placeholder="Ex: Cotonou, Benin"
                    />
                  </Field>
                </div>

                <Field label="Objectifs de publication">
                  <textarea
                    value={publishingGoals}
                    onChange={(event) => setPublishingGoals(event.target.value)}
                    rows={3}
                    className={textareaClassName}
                    placeholder="Ex: publier une premiere collection, ouvrir le catalogue Premium..."
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Instagram">
                    <input value={instagramUrl} onChange={(event) => setInstagramUrl(event.target.value)} className={inputClassName} />
                  </Field>
                  <Field label="X / Twitter">
                    <input value={xUrl} onChange={(event) => setXUrl(event.target.value)} className={inputClassName} />
                  </Field>
                  <Field label="Facebook">
                    <input value={facebookUrl} onChange={(event) => setFacebookUrl(event.target.value)} className={inputClassName} />
                  </Field>
                  <Field label="LinkedIn">
                    <input value={linkedinUrl} onChange={(event) => setLinkedinUrl(event.target.value)} className={inputClassName} />
                  </Field>
                </div>
              </div>
            </details>
          </SectionCard>
        ) : null}

        <details className="rounded-xl border border-[#d5d9d9] bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-semibold text-[#0f1111] marker:hidden">
            Ajouter des informations optionnelles
            <ChevronDown className="h-4 w-4 text-[#565959]" />
          </summary>
          <div className="grid gap-4 border-t border-[#d5d9d9] px-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Telephone" hint="Optionnel">
                <input value={phone} onChange={(event) => setPhone(event.target.value)} className={inputClassName} autoComplete="tel" />
              </Field>
              <Field label="Ville et pays" hint="Optionnel">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    className={inputClassName}
                    placeholder="Ville"
                    autoComplete="address-level2"
                  />
                  <input
                    value={country}
                    onChange={(event) => setCountry(event.target.value)}
                    className={inputClassName}
                    placeholder="Pays"
                    autoComplete="country-name"
                  />
                </div>
              </Field>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-[#0f1111]">Categories preferees</p>
              <p className="text-xs leading-5 text-[#565959]">Ces preferences aident les recommandations sans bloquer la creation du compte.</p>
              <div className="flex flex-wrap gap-2">
                {BOOK_CATEGORIES.map((category) => {
                  const active = favoriteCategories.includes(category);
                  return (
                    <CategoryChip
                      key={category}
                      active={active}
                      label={category}
                      onClick={() => setFavoriteCategories((previous) => toggleSelection(previous, category))}
                    />
                  );
                })}
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-lg border border-[#d5d9d9] bg-[#f7fafa] px-4 py-3 text-sm leading-6 text-[#374151]">
              <input
                type="checkbox"
                checked={marketingOptIn}
                onChange={(event) => setMarketingOptIn(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[#a6a6a6] text-[#232f3e] focus:ring-[#fbd8a5]"
              />
              <span>Je veux recevoir les sorties, recommandations editoriales et offres adaptees a mon profil.</span>
            </label>
          </div>
        </details>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-[#d13212] bg-[#fff2f2] px-4 py-3 text-sm text-[#b12704]">{error}</p>
      ) : null}
      {success ? (
        <p className="mt-4 rounded-lg border border-[#067d62] bg-[#f1fff8] px-4 py-3 text-sm text-[#067d62]">{success}</p>
      ) : null}

      <div className="mt-5 space-y-3">
        <button
          disabled={loading}
          className="inline-flex h-11 w-full items-center justify-center rounded-full border border-[#fcd200] bg-[#ffd814] px-4 text-sm font-semibold text-[#0f1111] transition hover:bg-[#f7ca00] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creation du compte..." : role === "author" ? "Creer mon espace auteur" : "Creer mon compte lecteur"}
        </button>
        <p className="text-xs leading-6 text-[#565959]">
          En continuant, vous acceptez la creation de votre compte Holistique Books et la confirmation par email.
        </p>
      </div>
    </form>
  );
}
