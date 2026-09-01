import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Camera, CheckCircle2, Globe2, Newspaper, UserRound } from "lucide-react";
import { DashboardTopbar } from "@/components/ui/dashboard-topbar";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { updateAuthorProfileAction } from "./actions";

type AuthorProfile = Database["public"]["Tables"]["author_profiles"]["Row"];

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function pressValue(items: Record<string, unknown>[]) {
  return items.flatMap((item) => {
    const title = stringValue(item.title);
    const url = stringValue(item.url);
    return title && url ? [`${title} | ${url}`] : [];
  }).join("\n");
}

export default async function AuthorProfileEditorPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const profile = await requireRole(["author"]);
  const supabase = await createClient();
  const [{ data }, query] = await Promise.all([
    supabase.from("author_profiles").select("*").eq("id", profile.id).returns<AuthorProfile>().single(),
    searchParams,
  ]);
  const author = data as unknown as AuthorProfile;
  const { data: signedAvatar } = author.avatar_url
    ? await supabase.storage.from("books").createSignedUrl(author.avatar_url, 3600)
    : { data: null };
  const avatarUrl = author.avatar_url?.startsWith("http") ? author.avatar_url : signedAvatar?.signedUrl;

  return (
    <section className="space-y-5">
      <DashboardTopbar
        kicker="Identité publique"
        title="Mon profil auteur"
        description="Construisez une page professionnelle qui présente votre parcours, votre univers et vos publications."
        actions={<Link href={`/authors/${profile.id}`} target="_blank" className="inline-flex h-11 items-center gap-2 rounded-full border border-[#dfd4c8] bg-white px-4 text-sm font-bold text-[#28231f]">Voir ma page publique <ArrowUpRight className="h-4 w-4" /></Link>}
      />

      {query.saved ? <p className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"><CheckCircle2 className="h-4 w-4" /> Profil enregistré.</p> : null}
      {query.error ? <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">Impossible d’enregistrer. Vérifiez les champs et utilisez une image JPG, PNG ou WebP de moins de 5 Mo.</p> : null}

      <form action={updateAuthorProfileAction} className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="self-start rounded-[2rem] border border-[#e5d9cc] bg-[#173f38] p-6 text-white xl:sticky xl:top-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f5bd58]">Votre portrait</p>
          <div className="mx-auto mt-6 grid aspect-[0.82] max-w-[250px] place-items-center overflow-hidden rounded-[1.8rem] bg-white/10 ring-1 ring-white/15">
            {avatarUrl ? <Image src={avatarUrl} alt={author.display_name} width={500} height={610} className="h-full w-full object-cover" priority /> : <UserRound className="h-20 w-20 text-white/30" />}
          </div>
          <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#f5b942] px-4 py-3 text-sm font-extrabold text-[#292219] transition hover:bg-[#ffc95d]">
            <Camera className="h-4 w-4" /> Choisir une photo
            <input type="file" name="avatar" accept="image/jpeg,image/png,image/webp" className="sr-only" />
          </label>
          <p className="mt-3 text-center text-xs leading-5 text-white/55">Portrait vertical recommandé. JPG, PNG ou WebP, maximum 5 Mo.</p>
        </aside>

        <div className="space-y-5">
          <fieldset className="rounded-[2rem] border border-[#e5d9cc] bg-white p-5 sm:p-7">
            <legend className="px-2 text-sm font-extrabold text-[#28231f]">Identité professionnelle</legend>
            <div className="mt-3 grid gap-5 sm:grid-cols-2">
              <Field label="Nom public" name="display_name" defaultValue={author.display_name} required />
              <Field label="Titre professionnel" name="professional_headline" defaultValue={author.professional_headline} placeholder="Écrivain, essayiste, conférencier…" />
              <Field label="Ville et pays" name="location" defaultValue={author.location} placeholder="Kinshasa, RDC" />
              <Field label="Téléphone professionnel" name="phone" defaultValue={author.phone} />
              <Field label="Site internet" name="website" defaultValue={author.website} placeholder="https://…" />
              <Field label="Genres littéraires" name="genres" defaultValue={author.genres.join(", ")} placeholder="Roman, Spiritualité, Business" />
            </div>
            <TextArea label="Biographie" name="bio" defaultValue={author.bio} rows={9} hint="Racontez votre parcours à la première personne. Séparez les idées en paragraphes." />
            <TextArea label="Démarche éditoriale" name="publishing_goals" defaultValue={author.publishing_goals} rows={4} hint="Votre vision, vos sujets et l’impact que vous souhaitez créer." />
          </fieldset>

          <fieldset className="rounded-[2rem] border border-[#e5d9cc] bg-white p-5 sm:p-7">
            <legend className="px-2 text-sm font-extrabold text-[#28231f]">Univers littéraire</legend>
            <div className="mt-3 grid gap-5 sm:grid-cols-3">
              <Field label="Livre favori" name="favorite_book" defaultValue={author.favorite_book} />
              <Field label="Auteur favori" name="favorite_author" defaultValue={author.favorite_author} />
              <Field label="Héros ou héroïne favori(te)" name="favorite_character" defaultValue={author.favorite_character} />
            </div>
          </fieldset>

          <fieldset className="rounded-[2rem] border border-[#e5d9cc] bg-white p-5 sm:p-7">
            <legend className="flex items-center gap-2 px-2 text-sm font-extrabold text-[#28231f]"><Globe2 className="h-4 w-4" /> Réseaux et visibilité</legend>
            <div className="mt-3 grid gap-5 sm:grid-cols-2">
              {(["instagram", "facebook", "linkedin", "x", "youtube"] as const).map((network) => <Field key={network} label={network === "x" ? "X / Twitter" : network[0].toUpperCase() + network.slice(1)} name={network} defaultValue={stringValue(author.social_links[network])} placeholder="https://…" />)}
            </div>
          </fieldset>

          <fieldset className="rounded-[2rem] border border-[#e5d9cc] bg-white p-5 sm:p-7">
            <legend className="flex items-center gap-2 px-2 text-sm font-extrabold text-[#28231f]"><Newspaper className="h-4 w-4" /> Revue de presse</legend>
            <TextArea label="Articles, interviews et médias" name="press_mentions" defaultValue={pressValue(author.press_mentions)} rows={6} hint="Une référence par ligne au format : Titre de l’article | https://lien-vers-article.com" />
          </fieldset>

          <button type="submit" className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#e85d3f] px-7 text-sm font-extrabold text-white shadow-lg transition hover:bg-[#cf4d33] sm:w-auto">Enregistrer mon profil</button>
        </div>
      </form>
    </section>
  );
}

function Field({ label, name, defaultValue, placeholder, required = false }: { label: string; name: string; defaultValue?: string | null; placeholder?: string; required?: boolean }) {
  return <label className="grid gap-2 text-sm font-bold text-[#403830]"><span>{label}</span><input name={name} defaultValue={defaultValue ?? ""} placeholder={placeholder} required={required} className="min-h-12 rounded-xl border border-[#ded2c6] bg-[#fcfaf7] px-4 text-base font-normal outline-none transition focus:border-[#e85d3f] focus:ring-4 focus:ring-[#e85d3f]/10 sm:text-sm" /></label>;
}

function TextArea({ label, name, defaultValue, rows, hint }: { label: string; name: string; defaultValue?: string | null; rows: number; hint: string }) {
  return <label className="mt-5 grid gap-2 text-sm font-bold text-[#403830]"><span>{label}</span><textarea name={name} defaultValue={defaultValue ?? ""} rows={rows} className="rounded-xl border border-[#ded2c6] bg-[#fcfaf7] px-4 py-3 text-base font-normal leading-7 outline-none transition focus:border-[#e85d3f] focus:ring-4 focus:ring-[#e85d3f]/10 sm:text-sm" /><span className="text-xs font-normal leading-5 text-[#887b70]">{hint}</span></label>;
}
