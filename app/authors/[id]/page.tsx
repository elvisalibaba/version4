import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, ExternalLink, Globe2, MapPin, Newspaper, Quote, Sparkles } from "lucide-react";
import { getPublicAuthorById } from "@/lib/authors";

type Props = { params: Promise<{ id: string }> };

function safeUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch { return null; }
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const author = await getPublicAuthorById((await params).id);
  if (!author) return { title: "Auteur introuvable", robots: { index: false } };
  const description = author.bio?.trim().slice(0, 160) || `Découvrez les livres et l’univers de ${author.display_name}.`;
  return {
    title: author.display_name,
    description,
    alternates: { canonical: `/authors/${author.id}` },
    openGraph: { type: "profile", title: author.display_name, description, url: `/authors/${author.id}`, images: author.avatar_signed_url ? [author.avatar_signed_url] : undefined },
  };
}

export default async function AuthorPage({ params }: Props) {
  const author = await getPublicAuthorById((await params).id);
  if (!author) notFound();

  const website = safeUrl(author.website);
  const socials = Object.entries(author.social_links ?? {}).flatMap(([name, value]) => {
    const url = safeUrl(value);
    return url ? [{ name: name === "x" ? "X / Twitter" : name[0].toUpperCase() + name.slice(1), url }] : [];
  });
  const press = (author.press_mentions ?? []).flatMap((item) => {
    const title = typeof item.title === "string" ? item.title : "";
    const url = safeUrl(item.url);
    return title && url ? [{ title, url }] : [];
  });
  const favorites = [
    { label: "Livre favori", value: author.favorite_book },
    { label: "Auteur favori", value: author.favorite_author },
    { label: "Héros ou héroïne favori(te)", value: author.favorite_character },
  ].filter((item) => item.value);

  return (
    <div className="min-h-screen bg-[#f8f4ed] text-[#1d1a17]">
      <section className="relative overflow-hidden border-b border-[#dfd2c5] bg-[#fffdf9]">
        <div className="absolute right-0 top-0 h-full w-2/5 bg-[#173f38] max-lg:hidden" />
        <div className="absolute right-[32%] top-0 h-full w-40 -skew-x-12 bg-[#e85d3f] max-lg:hidden" />
        <div className="relative mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
          <Link href="/authors" className="inline-flex min-h-10 items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[#8c5545] hover:text-[#bd452e]"><ArrowLeft className="h-4 w-4" /> Tous les auteurs</Link>
          <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-center lg:gap-20">
            <div className="max-w-3xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#c34d35]">Auteur Holistique Books</p>
              <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.02] tracking-[-0.055em] sm:text-6xl">{author.display_name}</h1>
              <p className="mt-4 text-lg font-semibold text-[#5f554d] sm:text-xl">{author.professional_headline || author.top_category}</p>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm font-semibold text-[#766a60]">
                {author.location ? <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-[#d25238]" />{author.location}</span> : null}
                {website ? <a href={website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-[#c34d35]"><Globe2 className="h-4 w-4 text-[#d25238]" />Site internet <ExternalLink className="h-3.5 w-3.5" /></a> : null}
              </div>
              {socials.length > 0 ? <div className="mt-5 flex flex-wrap gap-2">{socials.map((social) => <a key={social.name} href={social.url} target="_blank" rel="noreferrer" className="rounded-full border border-[#ddd0c3] bg-white px-3 py-2 text-xs font-bold text-[#51483f] transition hover:border-[#e85d3f] hover:text-[#b8422c]">{social.name}</a>)}</div> : null}
            </div>
            <div className="relative mx-auto w-full max-w-[300px] lg:mx-0 lg:justify-self-end">
              <div className="aspect-[0.82] overflow-hidden rounded-[2.2rem] bg-[#e7ddcf] shadow-[0_30px_70px_rgba(0,0,0,.28)] ring-1 ring-white/20">
                {author.avatar_signed_url ? <Image src={author.avatar_signed_url} alt={`Portrait de ${author.display_name}`} width={600} height={730} priority className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center bg-[linear-gradient(145deg,#e5b95f,#c45a3d)] font-display text-6xl font-extrabold text-white">{initials(author.display_name)}</div>}
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_310px] lg:gap-20">
          <div>
            <section>
              <div className="flex items-center gap-3"><Quote className="h-5 w-5 text-[#d25238]" /><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#c34d35]">Ma biographie</p></div>
              <div className="mt-6 whitespace-pre-line font-serif text-[1.05rem] leading-9 text-[#51483f] sm:text-lg">{author.bio?.trim() || "Cet auteur prépare actuellement sa biographie."}</div>
            </section>
            {author.publishing_goals ? <section className="mt-10 border-t border-[#ded2c6] pt-8"><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#c34d35]">Ma démarche</p><p className="mt-4 whitespace-pre-line text-base leading-8 text-[#5f554d]">{author.publishing_goals}</p></section> : null}
          </div>

          <aside className="space-y-5">
            {favorites.length > 0 ? <section className="rounded-[1.8rem] bg-[#173f38] p-6 text-white"><Sparkles className="h-5 w-5 text-[#f5b942]" /><h2 className="mt-4 font-display text-xl font-extrabold">Mon univers littéraire</h2><dl className="mt-6 space-y-5">{favorites.map((item) => <div key={item.label}><dt className="text-[0.65rem] font-extrabold uppercase tracking-[0.16em] text-white/48">{item.label}</dt><dd className="mt-1 text-sm font-bold leading-6 text-white/88">{item.value}</dd></div>)}</dl></section> : null}
            {author.genres.length > 0 ? <section className="rounded-[1.8rem] border border-[#ded2c6] bg-white p-6"><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#c34d35]">J’écris autour de</p><div className="mt-4 flex flex-wrap gap-2">{author.genres.map((genre) => <span key={genre} className="rounded-full bg-[#f2ebe3] px-3 py-2 text-xs font-bold text-[#5b5148]">{genre}</span>)}</div></section> : null}
          </aside>
        </div>

        <section className="mt-16 border-t border-[#ded2c6] pt-12 sm:mt-20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#c34d35]">Du même auteur</p><h2 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.04em]">Les livres de {author.display_name}</h2></div><Link href={`/books?author=${encodeURIComponent(author.display_name)}`} className="inline-flex items-center gap-2 text-sm font-bold text-[#b9432d]">Voir dans la librairie <ArrowRight className="h-4 w-4" /></Link></div>
          {author.books.length > 0 ? <div className="mt-8 divide-y divide-[#ded2c6]">{author.books.map((book) => (
            <article key={book.id} className="grid gap-5 py-7 first:pt-0 sm:grid-cols-[110px_minmax(0,1fr)_auto] sm:items-center">
              <Link href={`/book/${book.id}`} className="block w-[110px] overflow-hidden rounded-xl bg-[#e4dbd1] shadow-md"><div className="aspect-[0.69]">{book.cover_signed_url ? <Image src={book.cover_signed_url} alt={`Couverture de ${book.title}`} width={220} height={320} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center p-2 text-center text-xs font-bold">{book.title}</div>}</div></Link>
              <div><h3 className="font-display text-xl font-extrabold tracking-[-0.025em]">{book.title}</h3>{book.description ? <p className="mt-3 line-clamp-3 max-w-3xl text-sm leading-7 text-[#665c53]">{book.description}</p> : null}<p className="mt-3 text-sm font-extrabold text-[#176052]">{book.display_price_label || (book.is_free ? "Gratuit" : `${book.price.toFixed(2)} ${book.currency_code}`)}</p></div>
              <Link href={book.is_free ? `/book/${book.id}?read=1` : `/book/${book.id}`} className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#e85d3f] px-5 text-sm font-extrabold text-white">{book.is_free ? "Lire" : "Voir le livre"}</Link>
            </article>
          ))}</div> : <div className="mt-8 rounded-2xl border border-[#ded2c6] bg-white p-8 text-center"><BookOpen className="mx-auto h-6 w-6 text-[#c34d35]" /><p className="mt-3 font-bold">La première publication arrive bientôt.</p></div>}
        </section>

        {press.length > 0 ? <section className="mt-16 border-t border-[#ded2c6] pt-12"><div className="flex items-center gap-3"><Newspaper className="h-5 w-5 text-[#d25238]" /><div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#c34d35]">Médias</p><h2 className="mt-1 font-display text-3xl font-extrabold">Revue de presse</h2></div></div><div className="mt-7 grid gap-3 sm:grid-cols-2">{press.map((item) => <a key={`${item.title}-${item.url}`} href={item.url} target="_blank" rel="noreferrer" className="group flex items-center justify-between gap-4 rounded-2xl border border-[#ded2c6] bg-white p-5 font-bold transition hover:border-[#e85d3f]"><span>{item.title}</span><ExternalLink className="h-4 w-4 shrink-0 text-[#c34d35] transition group-hover:translate-x-0.5" /></a>)}</div></section> : null}
      </main>
    </div>
  );
}
