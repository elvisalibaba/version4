"use client";

import { useMemo, useState } from "react";
import { BookOpen, PenTool, UserRound } from "lucide-react";
import { BOOK_CATEGORIES } from "@/lib/book-categories";
import { getSupabaseBrowserConfigErrorMessage, getSupabaseBrowserErrorMessage } from "@/lib/supabase/browser-errors";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/database";

type RoleOption = Exclude<UserRole, "admin">;

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
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      {children}
      {hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
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
  icon: typeof UserRound;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[1.6rem] border p-4 text-left transition ${
        active
          ? "border-violet-500 bg-violet-50 shadow-[0_18px_40px_rgba(89,52,211,0.12)]"
          : "border-violet-100 bg-white hover:border-violet-200 hover:bg-violet-50/40"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className={`rounded-full p-2 ${active ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600"}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-950">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
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

    if (role === "author" && !displayName.trim()) {
      setError("Ajoute au moins un nom de plume ou nom public auteur.");
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
      const cleanFavoriteCategories = favoriteCategories;
      const cleanAuthorGenres = authorGenres;
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
            favorite_categories: cleanFavoriteCategories,
            marketing_opt_in: marketingOptIn,
            author_profile:
              role === "author"
                ? {
                    display_name: displayName.trim(),
                    professional_headline: professionalHeadline.trim() || null,
                    bio: bio.trim() || null,
                    website: website.trim() || null,
                    location: authorLocation.trim() || null,
                    genres: cleanAuthorGenres,
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
        setSuccess("Compte cree. Verifie ton email. Apres confirmation, vous serez renvoye automatiquement vers votre espace.");
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
    <form onSubmit={onSubmit} className="surface-panel space-y-8 p-7 sm:p-8">
      <div className="space-y-3">
        <p className="premium-badge">Inscription</p>
        <h1 className="section-title text-3xl">Creez un compte vraiment complet</h1>
        <p className="text-sm leading-7 text-slate-500">
          HolistiqueBooks collecte maintenant des informations utiles pour mieux connaitre les lecteurs, mieux accompagner les auteurs et rendre le pilotage admin plus professionnel.
        </p>
      </div>

      <section className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-500">Profil de compte</p>
          <h2 className="text-xl font-semibold text-slate-950">Choisissez votre parcours</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <RoleCard
            active={role === "reader"}
            icon={BookOpen}
            title="Lecteur"
            description="Pour acheter, lire, noter et construire une bibliotheque Premium plus personnalisee."
            onClick={() => setRole("reader")}
          />
          <RoleCard
            active={role === "author"}
            icon={PenTool}
            title="Auteur"
            description="Pour proposer vos livres avec un vrai profil public et un onboarding plus serieux, proche d une marketplace pro."
            onClick={() => setRole("author")}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-500">Identite</p>
            <h2 className="text-xl font-semibold text-slate-950">Informations personnelles</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Prenom">
              <input value={firstName} onChange={(event) => setFirstName(event.target.value)} className="ios-input w-full px-4 py-3.5" required />
            </Field>
            <Field label="Nom">
              <input value={lastName} onChange={(event) => setLastName(event.target.value)} className="ios-input w-full px-4 py-3.5" required />
            </Field>
          </div>
          <Field label="Email">
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="ios-input w-full px-4 py-3.5" required />
          </Field>
          <Field label="Mot de passe" hint="Minimum recommande: 8 caracteres.">
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="ios-input w-full px-4 py-3.5" required />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Telephone">
              <input value={phone} onChange={(event) => setPhone(event.target.value)} className="ios-input w-full px-4 py-3.5" />
            </Field>
            <Field label="Langue preferee">
              <select value={preferredLanguage} onChange={(event) => setPreferredLanguage(event.target.value)} className="ios-input w-full px-4 py-3.5">
                <option value="fr">Francais</option>
                <option value="en">Anglais</option>
                <option value="es">Espagnol</option>
              </select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Pays">
              <input value={country} onChange={(event) => setCountry(event.target.value)} className="ios-input w-full px-4 py-3.5" />
            </Field>
            <Field label="Ville">
              <input value={city} onChange={(event) => setCity(event.target.value)} className="ios-input w-full px-4 py-3.5" />
            </Field>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-500">Affinites</p>
            <h2 className="text-xl font-semibold text-slate-950">Categories favorites</h2>
          </div>
          <div className="rounded-[1.6rem] border border-violet-100 bg-violet-50/50 p-4">
            <p className="text-sm leading-6 text-slate-500">
              Ces preferences servent a mieux comprendre le profil lecteur et a enrichir la supervision admin.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {BOOK_CATEGORIES.map((category) => {
                const active = favoriteCategories.includes(category);
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setFavoriteCategories((previous) => toggleSelection(previous, category))}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      active ? "border-violet-600 bg-violet-600 text-white" : "border-violet-200 bg-white text-slate-700"
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
          <label className="flex items-start gap-3 rounded-[1.4rem] border border-violet-100 bg-white px-4 py-4 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={marketingOptIn}
              onChange={(event) => setMarketingOptIn(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-600"
            />
            J accepte de recevoir des recommandations editoriales, des sorties et des offres adaptees a mon profil.
          </label>
        </div>
      </section>

      {role === "author" ? (
        <section className="space-y-6 rounded-[2rem] border border-violet-100 bg-[linear-gradient(135deg,_rgba(248,245,255,0.96),_rgba(255,255,255,0.96))] p-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-500">Auteur onboarding</p>
            <h2 className="text-2xl font-semibold text-slate-950">Profil auteur complet</h2>
            <p className="text-sm leading-7 text-slate-500">
              Cette section donne a l equipe une vraie vision du positionnement auteur, du niveau de maturite et des genres portes sur la plateforme.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="Nom public / nom de plume">
              <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="ios-input w-full px-4 py-3.5" required={role === "author"} />
            </Field>
            <Field label="Headline professionnelle">
              <input
                value={professionalHeadline}
                onChange={(event) => setProfessionalHeadline(event.target.value)}
                className="ios-input w-full px-4 py-3.5"
                placeholder="Ex: Autrice feel-good & developpement personnel"
              />
            </Field>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="Site web">
              <input value={website} onChange={(event) => setWebsite(event.target.value)} className="ios-input w-full px-4 py-3.5" placeholder="https://..." />
            </Field>
            <Field label="Localisation auteur">
              <input
                value={authorLocation}
                onChange={(event) => setAuthorLocation(event.target.value)}
                className="ios-input w-full px-4 py-3.5"
                placeholder="Ex: Cotonou, Benin"
              />
            </Field>
          </div>

          <Field label="Biographie auteur">
            <textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={5} className="ios-input w-full px-4 py-3.5" />
          </Field>

          <Field label="Objectifs de publication">
            <textarea
              value={publishingGoals}
              onChange={(event) => setPublishingGoals(event.target.value)}
              rows={4}
              className="ios-input w-full px-4 py-3.5"
              placeholder="Ex: lancer une premiere collection, publier 4 titres par an, toucher la diaspora francophone..."
            />
          </Field>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Genres et categories portes</p>
            <div className="flex flex-wrap gap-2">
              {BOOK_CATEGORIES.map((category) => {
                const active = authorGenres.includes(category);
                return (
                  <button
                    key={`author-${category}`}
                    type="button"
                    onClick={() => setAuthorGenres((previous) => toggleSelection(previous, category))}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      active ? "border-violet-600 bg-violet-600 text-white" : "border-violet-200 bg-white text-slate-700"
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="Instagram">
              <input value={instagramUrl} onChange={(event) => setInstagramUrl(event.target.value)} className="ios-input w-full px-4 py-3.5" />
            </Field>
            <Field label="X / Twitter">
              <input value={xUrl} onChange={(event) => setXUrl(event.target.value)} className="ios-input w-full px-4 py-3.5" />
            </Field>
            <Field label="Facebook">
              <input value={facebookUrl} onChange={(event) => setFacebookUrl(event.target.value)} className="ios-input w-full px-4 py-3.5" />
            </Field>
            <Field label="LinkedIn">
              <input value={linkedinUrl} onChange={(event) => setLinkedinUrl(event.target.value)} className="ios-input w-full px-4 py-3.5" />
            </Field>
          </div>
        </section>
      ) : null}

      {error ? <p className="rounded-[1.25rem] bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {success ? <p className="rounded-[1.25rem] bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}

      <button disabled={loading} className="cta-primary w-full px-4 py-3.5 text-sm disabled:opacity-60">
        {loading ? "Creation..." : role === "author" ? "Creer mon espace auteur" : "Creer mon compte lecteur"}
      </button>
    </form>
  );
}
