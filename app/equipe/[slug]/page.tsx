import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Globe2 } from "lucide-react";
import { COMPANY } from "@/lib/holistique";
import { getRepresentative, REPRESENTATIVES } from "@/lib/representants";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return REPRESENTATIVES.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const person = getRepresentative(slug);
  if (!person) return { title: "Représentant introuvable" };
  return {
    title: `${person.name} · ${person.country} · Holistique Books`,
    description: person.summary,
    alternates: { canonical: `/equipe/${person.slug}` },
    openGraph: { title: person.name, description: person.summary, images: [{ url: person.image }] },
  };
}

export default async function RepresentativePage({ params }: Props) {
  const { slug } = await params;
  const person = getRepresentative(slug);
  if (!person) {
    notFound();
  }

  return (
    <main className="hb-fullbleed min-h-screen bg-paper text-night-900">
      <section className="bg-night-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <Link href="/qui-sommes-nous#representations" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-300 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Retour aux représentations
          </Link>
          <p className="mt-10 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-brand-300">
            <Globe2 className="h-4 w-4" aria-hidden="true" />
            Représentation · {person.country}
          </p>
          <h1 className="mt-3 max-w-4xl text-3xl font-bold tracking-tight sm:text-5xl">{person.name}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-night-100">{person.role}</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl items-start gap-9 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-16 lg:px-8 lg:py-16">
        <aside className="overflow-hidden rounded-md border border-rule bg-white">
          <div className="relative aspect-[4/5] overflow-hidden bg-paper-deep">
            <Image src={person.image} alt={`Portrait de ${person.name}, représentant ${person.country} de Holistique Books`} fill priority sizes="(max-width: 1024px) 100vw, 360px" className="object-cover object-top" />
          </div>
          <div className="p-6">
            <p className="text-sm font-semibold text-brand-700">{person.flag} {person.country}</p>
            <h2 className="mt-2 text-xl font-bold">{person.name}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{person.summary}</p>
          </div>
        </aside>

        <article className="min-w-0">
          <div className="mb-8 flex items-center gap-3 border-b border-rule pb-5">
            <BookOpen className="h-6 w-6 text-brand-700" aria-hidden="true" />
            <h2 className="text-2xl font-bold">Présentation biographique</h2>
          </div>
          <div className="space-y-6">
            {person.biography.map((paragraph, index) => (
              <p key={index} className="text-base leading-8 text-slate-700 sm:text-lg">{paragraph}</p>
            ))}
          </div>
          <div className="mt-10 border-l-4 border-brand-600 bg-white p-6">
            <p className="font-semibold text-night-900">{COMPANY.name}</p>
            <p className="mt-1 italic text-slate-600">« {COMPANY.slogan}. »</p>
          </div>
          <Link href="/qui-sommes-nous#representations" className="mt-8 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-brand-700 hover:underline">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voir les autres représentations
          </Link>
        </article>
      </section>
    </main>
  );
}
