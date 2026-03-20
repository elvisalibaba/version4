"use client";

import { useMemo, useState } from "react";
import { BookOpen, ChevronDown, PenTool, ShieldCheck, type LucideIcon } from "lucide-react";
import { BOOK_CATEGORIES } from "@/lib/book-categories";
import { getSupabaseBrowserConfigErrorMessage, getSupabaseBrowserErrorMessage } from "@/lib/supabase/browser-errors";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/database";

type RoleOption = Exclude<UserRole, "admin">;

const inputClassName =
  "h-12 w-full rounded-2xl border border-[#e7ddd1] bg-white px-4 text-sm text-[#171717] outline-none transition placeholder:text-[#9a8f84] focus:border-[#ff7a5c]/45 focus:ring-4 focus:ring-[#ff7a5c]/10";

const textareaClassName =
  "w-full rounded-2xl border border-[#e7ddd1] bg-white px-4 py-3 text-sm text-[#171717] outline-none transition placeholder:text-[#9a8f84] focus:border-[#ff7a5c]/45 focus:ring-4 focus:ring-[#ff7a5c]/10";

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
    <label className="grid gap-2">
      <span className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#7d7267]">{label}</span>
      {children}
      {hint ? <span className="text-xs text-[#9a8f84]">{hint}</span> : null}
    </label>
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
      className={`rounded-[26px] border p-4 text-left transition ${
        active
          ? "border-[#171717] bg-[#171717] text-white shadow-[0_18px_34px_rgba(15,23,42,0.18)]"
          : "border-[#e7ddd1] bg-white text-[#171717] hover:border-[#cfc2b4] hover:bg-[#fcfaf7]"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${
            active ? "bg-white/12 text-white" : "bg-[#fff1ea] text-[#ff6a4c]"
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-semibold">{title}</p>
          <p className={`text-sm leading-6 ${active ? "text-white/72" : "text-[#6f665e]"}`}>{description}</p>
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
      className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
        active
          ? "border-[#171717] bg-[#171717] text-white"
          : "border-[#e7ddd1] bg-white text-[#4f4740] hover:border-[#cfc2b4] hover:bg-[#fcfaf7]"
      }`}
    >
      {label}
    </button>
  );
}

export function RegisterForm() {
  const [role, setRole] = useState<RoleOption>("reader");
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
    <form
      onSubmit={onSubmit}
      className="grid gap-6 rounded-[32px] border border-[#e7ddd1] bg-white/95 p-5 shadow-[0_28px_70px_rgba(15,23,42,0.08)] sm:p-8"
    >
      <div className="space-y-3">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#fff1ea] px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#a85b3f]">
          <ShieldCheck className="h-3.5 w-3.5" />
          Compte HolistiqueBooks
        </span>
        <div className="space-y-2">
          <h1 className="text-[1.9rem] font-semibold tracking-[-0.04em] text-[#171717] sm:text-[2.35rem]">
            Creez un compte simple, propre et pret pour la production.
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-[#6f665e]">
            Le parcours est plus direct pour les lecteurs et plus clair pour les auteurs. Les informations avancees restent
            disponibles sans alourdir l inscription.
          </p>
        </div>
      </div>

      <section className="grid gap-4 rounded-[28px] border border-[#efe6dc] bg-[#fcfaf7] p-4 sm:p-5">
        <div className="space-y-2">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#7d7267]">Type de compte</p>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#171717]">Choisis ton espace</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <RoleCard
            active={role === "reader"}
            icon={BookOpen}
            title="Lecteur"
            description="Bibliotheque, achats, lectures web et abonnements Premium."
            onClick={() => setRole("reader")}
          />
          <RoleCard
            active={role === "author"}
            icon={PenTool}
            title="Auteur"
            description="Catalogue, mise en ligne, ventes et studio de publication."
            onClick={() => setRole("author")}
          />
        </div>
      </section>

      <section className="grid gap-5 rounded-[28px] border border-[#efe6dc] bg-white p-4 sm:p-5">
        <div className="space-y-2">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#7d7267]">Acces</p>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#171717]">Informations essentielles</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
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

        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClassName}
            autoComplete="email"
            required
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
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
            <select
              value={preferredLanguage}
              onChange={(event) => setPreferredLanguage(event.target.value)}
              className={inputClassName}
            >
              <option value="fr">Francais</option>
              <option value="en">Anglais</option>
              <option value="es">Espagnol</option>
            </select>
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Telephone" hint="Optionnel">
            <input value={phone} onChange={(event) => setPhone(event.target.value)} className={inputClassName} autoComplete="tel" />
          </Field>
          <Field label="Ville ou pays" hint="Optionnel">
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
      </section>

      {role === "author" ? (
        <section className="grid gap-5 rounded-[28px] border border-[#efe6dc] bg-[linear-gradient(180deg,rgba(255,247,240,0.88),rgba(255,255,255,0.95))] p-4 sm:p-5">
          <div className="space-y-2">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#a85b3f]">Studio auteur</p>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#171717]">Active ton profil public</h2>
            <p className="text-sm leading-7 text-[#6f665e]">
              On garde seulement les champs utiles pour demarrer. Le reste peut etre complete apres connexion.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nom public auteur">
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className={inputClassName}
                placeholder="Nom de plume ou marque auteur"
                required={role === "author"}
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

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#7d7267]">Genres</p>
                <p className="mt-1 text-sm text-[#6f665e]">Selectionne les categories les plus proches de ton catalogue.</p>
              </div>
            </div>
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

          <details className="rounded-[24px] border border-[#efe6dc] bg-white/88">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-semibold text-[#26221d] marker:hidden">
              Completer le profil auteur maintenant
              <ChevronDown className="h-4 w-4 text-[#8a8176]" />
            </summary>
            <div className="grid gap-4 border-t border-[#f1e8de] px-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
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

              <div className="grid gap-4 md:grid-cols-2">
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
        </section>
      ) : null}

      <section className="grid gap-4 rounded-[28px] border border-[#efe6dc] bg-[#fcfaf7] p-4 sm:p-5">
        <div className="space-y-2">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#7d7267]">Personnalisation</p>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#171717]">Affiner le profil</h2>
        </div>

        <div className="space-y-3">
          <p className="text-sm leading-7 text-[#6f665e]">
            Ces categories aident la recommandation lecteur et la supervision admin, sans bloquer la creation du compte.
          </p>
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

        <label className="flex items-start gap-3 rounded-[22px] border border-[#e7ddd1] bg-white px-4 py-3 text-sm leading-6 text-[#5d554d]">
          <input
            type="checkbox"
            checked={marketingOptIn}
            onChange={(event) => setMarketingOptIn(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-[#d8cdc0] text-[#ff6a4c] focus:ring-[#ff7a5c]/20"
          />
          <span>Je veux recevoir les sorties, recommandations editoriales et offres adaptees a mon profil.</span>
        </label>
      </section>

      {error ? (
        <p className="rounded-[22px] border border-[#f4c6bb] bg-[#fff1ed] px-4 py-3 text-sm text-[#9f4a37]">{error}</p>
      ) : null}
      {success ? (
        <p className="rounded-[22px] border border-[#cfe6d6] bg-[#eef9f1] px-4 py-3 text-sm text-[#256147]">{success}</p>
      ) : null}

      <div className="grid gap-3">
        <button
          disabled={loading}
          className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#171717] px-4 text-sm font-semibold text-white transition hover:bg-[#0f172a] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creation en cours..." : role === "author" ? "Creer mon espace auteur" : "Creer mon compte lecteur"}
        </button>
        <p className="text-center text-xs leading-6 text-[#8b8177]">
          Confirmation email activee. Le compte reste compatible avec votre logique Supabase et les espaces dashboard existants.
        </p>
      </div>
    </form>
  );
}
