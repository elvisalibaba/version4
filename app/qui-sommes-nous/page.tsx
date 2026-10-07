import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, Church, Globe2, MapPin, Phone, Quote, Rocket } from "lucide-react";
import {
  COMPANY,
  COMPANY_TEAM,
  COMPANY_VALUES,
  INTERVENTION_POLES,
  NATIONAL_EDITORS,
  type InterventionPole,
} from "@/lib/holistique";

export const metadata: Metadata = {
  title: "Qui sommes-nous ?",
  description:
    "Holistique Books, entreprise de production littéraire transformationnelle basée à Kinshasa : trois pôles d’intervention — ecclésiastique, institutionnel et entrepreneurial — au service de la transformation par l’écriture.",
  alternates: { canonical: "/qui-sommes-nous" },
};

const POLE_ICONS: Record<InterventionPole["slug"], typeof Church> = {
  ecclesiastique: Church,
  institutionnel: Building2,
  entrepreneurial: Rocket,
};

const figures = [
  { value: String(COMPANY.founded), label: "Début de l’aventure éditoriale" },
  { value: String(COMPANY.formalized), label: "Formalisation de l’entreprise" },
  { value: `${COMPANY.countries.length} pays`, label: COMPANY.countries.join(" · ") },
  { value: "3 pôles", label: "Ecclésiastique · Institutionnel · Entrepreneurial" },
];

function initials(name: string) {
  return name
    .replace(/^Pasteur\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function QuiSommesNousPage() {
  return (
    <div className="hb-fullbleed bg-white text-slate-900">
      <section className="bg-night-900 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:px-8">
          <div className="hb-fade-up">
            <p className="text-sm font-semibold text-brand-300">Qui sommes-nous ?</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Transformer les idées en œuvres, et les œuvres en héritage.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-night-100 sm:text-lg">
              Holistique Books est une entreprise de production littéraire transformationnelle. Nous concevons, éditons et valorisons des contenus qui contribuent à la transformation de l’être humain, des institutions et de leur environnement.
            </p>
          </div>
          <figure className="border-l-2 border-brand-600 pl-6">
            <Quote aria-hidden="true" className="h-6 w-6 text-brand-300" />
            <blockquote className="mt-3 text-lg font-semibold leading-8 text-white/95">
              « La littérature est une âme de l’entreprise : elle n’est plus une option, mais une nécessité pour construire, transmettre et réussir. »
            </blockquote>
            <figcaption className="mt-4 text-sm text-night-200">Gode Muala — Directeur général</figcaption>
          </figure>
        </div>
      </section>

      <section aria-label="Holistique Books en chiffres" className="border-b border-slate-200 bg-slate-50">
        <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-slate-200 lg:grid-cols-4">
          {figures.map((figure) => (
            <div key={figure.label} className="bg-slate-50 px-4 py-6 sm:px-8">
              <dt className="order-2 mt-1 text-xs leading-5 text-slate-600 sm:text-sm">{figure.label}</dt>
              <dd className="text-2xl font-bold text-night-900 sm:text-3xl">{figure.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="hb-reveal mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div>
          <h2 className="text-sm font-semibold text-brand-700">Notre vision</h2>
          <p className="mt-3 text-2xl font-bold leading-snug tracking-tight">
            Devenir un écosystème éditorial transformationnel de référence en Afrique et au-delà.
          </p>
          <p className="mt-4 leading-7 text-slate-600">
            Nous mettons l’écriture, l’innovation et les nouvelles technologies au service de la transformation de l’être humain, des institutions et de leur environnement.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-brand-700">Notre mission</h2>
          <p className="mt-3 text-2xl font-bold leading-snug tracking-tight">
            Une prise en charge éditoriale complète, de la conception à la diffusion.
          </p>
          <p className="mt-4 leading-7 text-slate-600">
            Idée → écriture → editing → correction → design → mise en page → publication → impression → diffusion → distribution → promotion → lecteur cible.
          </p>
        </div>
      </section>

      <section id="poles" aria-labelledby="poles-title" className="hb-reveal scroll-mt-28 border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-brand-700">Nos pôles d’intervention</p>
          <h2 id="poles-title" className="mt-2 max-w-2xl text-3xl font-bold tracking-tight">
            Une Église a un message à transmettre, une institution un savoir à préserver, une entreprise une expertise à valoriser.
          </h2>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {INTERVENTION_POLES.map((pole) => {
              const Icon = POLE_ICONS[pole.slug];
              return (
                <article key={pole.slug} id={pole.slug} className="scroll-mt-32 flex flex-col rounded-lg border border-slate-200 bg-white p-6 target:ring-2 target:ring-brand-600">
                  <span className="grid h-12 w-12 place-items-center rounded-md bg-night-900 text-white">
                    <Icon aria-hidden="true" className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 text-xl font-bold">Pôle {pole.name.toLowerCase()}</h3>
                  <p className="mt-1 font-semibold text-brand-700">{pole.tagline}</p>
                  <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{pole.description}</p>
                  <p className="mt-4 text-xs font-medium text-slate-500">Pour : {pole.audience}</p>
                  <div className="mt-5 rounded-md bg-slate-50 px-4 py-3 text-sm">
                    <p className="font-semibold text-night-900">{pole.magazine.name}</p>
                    <p className="text-xs text-slate-600">{pole.magazine.focus}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section aria-labelledby="values-title" className="hb-reveal mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-700">Nos valeurs</p>
            <h2 id="values-title" className="mt-2 text-3xl font-bold tracking-tight">Grâce · Discipline · Intégrité · Excellence</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-slate-600">Bien concevoir. Bien produire. Bien présenter. Bien livrer.</p>
        </div>
        <ul className="mt-8 grid gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
          {COMPANY_VALUES.map((value) => (
            <li key={value.name} className="bg-white p-6">
              <p className="font-bold text-night-900">{value.name}</p>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">{value.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="team-title" className="hb-reveal border-t border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-sm font-semibold text-brand-700">L’équipe du siège</p>
            <h2 id="team-title" className="mt-2 text-2xl font-bold tracking-tight">Une direction centrale forte</h2>
            <ul className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
              {COMPANY_TEAM.map((member) => (
                <li key={member.name} className="flex items-center gap-4 px-5 py-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-night-900 text-sm font-bold text-white">{initials(member.name)}</span>
                  <span>
                    <span className="block font-semibold">{member.name}</span>
                    <span className="block text-sm text-slate-600">{member.role}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Autour d’elle, un réseau d’éditeurs, correcteurs, traducteurs, théologiens, graphistes, développeurs et experts mobilisés selon chaque projet.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-700">Présence en Afrique</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">Des représentations proches du terrain</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {NATIONAL_EDITORS.map((editor) => (
                <li key={editor.country} className="rounded-lg border border-slate-200 bg-white p-5">
                  <p className="flex items-center gap-2 text-sm font-bold text-night-900"><Globe2 aria-hidden="true" className="h-4 w-4 text-brand-600" />{editor.country}</p>
                  <p className="mt-2 font-semibold">{editor.name}</p>
                  <p className="text-sm text-slate-600">{editor.role}</p>
                </li>
              ))}
            </ul>
            <div className="mt-5 rounded-lg bg-night-900 p-5 text-white">
              <p className="flex items-start gap-2 text-sm"><MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" /><span><strong>Siège central</strong><br />{COMPANY.address.join(", ")}</span></p>
              <a href={COMPANY.phoneHref} className="mt-3 flex items-center gap-2 text-sm font-semibold hover:underline"><Phone aria-hidden="true" className="h-4 w-4 text-brand-300" />{COMPANY.phone}</a>
            </div>
          </div>
        </div>
      </section>

      <section className="hb-reveal bg-brand-600 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <p className="text-sm font-semibold text-white/80">{COMPANY.slogan}</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Une idée à transformer ? Parlons-en.</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/services#packs" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-white px-6 text-sm font-bold text-brand-700 transition hover:bg-slate-100">
              Voir nos packs <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <Link href="/formation-editoriale" className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/40 px-6 text-sm font-bold text-white transition hover:bg-white/10">
              Présenter mon projet
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
