import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, BookOpen, Boxes, Check, ChevronRight, CircleCheck, Factory,
  GraduationCap, Lightbulb, Megaphone, PenTool, Quote, Send, ShieldCheck,
  Sparkles, Target,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Ingénierie éditoriale et publication",
  description: "Découvrez les sept pôles de services Holistique Books : accompagnement éditorial, publication, impression, distribution, innovation numérique, formation et communication.",
  alternates: { canonical: "/services" },
  openGraph: {
    title: "Offre de services éditoriaux | Holistique Books",
    description: "De l’idée à la satisfaction du lecteur : une prise en charge complète de votre projet éditorial.",
    url: "/services",
  },
};

const approach = [
  { number: "01", title: "Comprendre", text: "Analyser votre vision, vos objectifs, votre public et les singularités du projet." },
  { number: "02", title: "Concevoir", text: "Structurer le contenu et organiser une stratégie éditoriale cohérente." },
  { number: "03", title: "Produire", text: "Corriger, réécrire, diriger, mettre en page, identifier et imprimer l’œuvre." },
  { number: "04", title: "Valoriser", text: "Déployer la communication, le marketing et la commercialisation du livre." },
  { number: "05", title: "Pérenniser", text: "Accompagner la diffusion, la carrière de l’auteur et l’impact durable de l’œuvre." },
];

const servicePoles = [
  {
    number: "01", title: "Service éditorial intégré", mission: "Transformer chaque idée en une œuvre d’excellence.", icon: PenTool,
    services: ["Diagnostic et orientation éditoriale", "Coaching, plan d’écriture et structuration", "Évaluation, correction et réécriture", "Direction éditoriale et mise en page", "Couverture, illustrations et préparation à l’impression", "ISBN, dépôt légal, impression et livraison"],
  },
  {
    number: "02", title: "Holistique Books Store", mission: "Distribuer le savoir partout.", icon: BookOpen,
    services: ["Librairie physique et librairie en ligne", "Marketplace éditoriale", "Vente B2B, B2C et institutionnelle", "Distribution nationale et africaine", "Distribution internationale", "Gestion des commandes et des stocks"],
  },
  {
    number: "03", title: "Import-export éditorial", mission: "Donner au livre une dimension internationale.", icon: Factory,
    services: ["Impression en Chine et à l’international", "Importation et exportation", "Transit documentaire", "Transport international", "Distribution internationale", "Logistique éditoriale"],
  },
  {
    number: "04", title: "NTIC & innovation éditoriale", mission: "Moderniser l’industrie du livre.", icon: Lightbulb,
    services: ["Livres numériques et livres audio", "Bibliothèques numériques", "Applications mobiles et plateformes digitales", "Intelligence artificielle appliquée à l’édition", "Archivage numérique", "Outils de gestion et logiciels d’écriture"],
  },
  {
    number: "05", title: "Académie & coaching éditorial", mission: "Former les auteurs et les professionnels du livre.", icon: GraduationCap,
    services: ["Académie des auteurs", "Coaching personnalisé et mentorat", "Masterclass, séminaires et ateliers", "Formations certifiantes", "Accompagnement des maisons d’édition"],
  },
  {
    number: "06", title: "Management & développement", mission: "Développer les organisations éditoriales.", icon: Boxes,
    services: ["Conseil stratégique et audit éditorial", "Création de maisons d’édition", "Structuration et organisation éditoriales", "Développement commercial", "Gestion de projets", "Accompagnement institutionnel"],
  },
  {
    number: "07", title: "Communication, marketing & diffusion", mission: "Faire connaître les auteurs et leurs œuvres.", icon: Megaphone,
    services: ["Branding auteur et identité éditoriale", "Communication institutionnelle et relations presse", "Marketing éditorial et publicité digitale", "Community management et production audiovisuelle", "Vernissages et conférences de presse", "Campagnes promotionnelles et gestion d’image"],
  },
];

const plans = [
  { label: "Pour commencer", name: "Pack Premium", description: "Pour les nouveaux auteurs qui veulent structurer leur projet et publier sur des bases professionnelles." },
  { label: "Pour se développer", name: "Pack Professionnel", description: "Pour les auteurs qui souhaitent professionnaliser leur œuvre et organiser une diffusion nationale." },
  { label: "Pour rayonner", name: "Pack Grande Diffusion", description: "Pour les institutions, entreprises et auteurs visant les marchés nationaux et internationaux." },
];

const collaborationSteps = ["Prise de contact", "Diagnostic", "Proposition technique", "Signature du contrat", "Production", "Validation", "Publication", "Commercialisation", "Distribution", "Suivi"];
const commitments = ["Excellence éditoriale", "Respect des délais", "Protection des droits d’auteur", "Confidentialité", "Accompagnement personnalisé", "Qualité internationale", "Satisfaction du client"];

export default function ServicesPage() {
  return (
    <div className="-mx-3 -mt-6 bg-[#f5f0e7] text-[#17231d] sm:-mx-6 lg:-mx-8">
      <section className="relative isolate overflow-hidden bg-[#173d2c] text-white">
        <div className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full border-[82px] border-[#e8ac42]/90" />
        <div className="pointer-events-none absolute -bottom-10 left-[42%] h-28 w-56 -skew-x-12 bg-[#c95d3e]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1fr_0.72fr] lg:items-end lg:px-10 lg:py-28">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#f2c66f]">Pôle d’ingénierie éditoriale · Groupe Holistique SARL</p>
            <h1 className="mt-6 max-w-4xl font-display text-4xl font-bold leading-[1.02] tracking-[-0.055em] sm:text-6xl lg:text-7xl">De l’idée à la satisfaction du lecteur.</h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/68 sm:text-lg">Une expertise intégrée pour concevoir, produire, publier, distribuer et valoriser des œuvres professionnelles à fort impact.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/formation-editoriale" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#e8ac42] px-6 text-sm font-bold text-[#173d2c] transition hover:bg-[#f2c66f]">Présenter mon projet <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
              <a href="#poles" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 px-6 text-sm font-bold text-white transition hover:bg-white/10">Explorer nos expertises</a>
            </div>
          </div>
          <div className="border-l border-white/15 pl-6 sm:pl-8">
            <Quote aria-hidden="true" className="h-7 w-7 text-[#f2c66f]" />
            <p className="mt-5 font-display text-xl font-semibold leading-8 text-white/92 sm:text-2xl">Nous ne publions pas seulement des livres. Nous construisons des œuvres qui inspirent, forment et transforment.</p>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-white/42">Signature Holistique Books</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#b85139]">Bienvenue</p>
            <h2 className="mt-4 font-display text-3xl font-bold leading-tight tracking-[-0.04em] sm:text-4xl">Un partenaire stratégique pour chaque projet.</h2>
          </div>
          <div className="space-y-5 text-base leading-8 text-[#645b53]">
            <p>Holistique Books accompagne les auteurs, entreprises, institutions, universités, organisations confessionnelles, ONG et administrations publiques dans la création de publications professionnelles à forte valeur ajoutée.</p>
            <p>Notre écosystème réunit l’ingénierie éditoriale, la production, l’impression, la distribution, l’innovation numérique, la formation et le marketing au sein d’un interlocuteur unique.</p>
            <div className="grid gap-3 pt-3 sm:grid-cols-2">
              {["Expertise complète", "Standards internationaux", "Suivi personnalisé", "Diffusion multicanale"].map((item) => (
                <p key={item} className="flex items-center gap-3 rounded-2xl border border-[#e7ddd2] bg-white px-4 py-3 text-sm font-bold text-[#28231f]"><CircleCheck aria-hidden="true" className="h-4 w-4 shrink-0 text-[#d45d42]" /> {item}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#e7ddd2] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#b85139]">Notre méthode</p>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-[-0.04em] sm:text-4xl">Un accompagnement qui couvre tout le cycle de vie du livre.</h2>
          </div>
          <ol className="mt-12 grid gap-px overflow-hidden rounded-[2rem] border border-[#e7ddd2] bg-[#e7ddd2] md:grid-cols-5">
            {approach.map((step) => (
              <li key={step.number} className="bg-[#fffdf9] p-6 sm:p-7">
                <span className="font-display text-sm font-bold text-[#d45d42]">{step.number}</span>
                <h3 className="mt-8 font-display text-xl font-bold">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#71675f]">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="poles" className="mx-auto max-w-7xl scroll-mt-28 px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#b85139]">Sept pôles de services</p>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-[-0.04em] sm:text-5xl">Toute la chaîne de valeur éditoriale, réunie.</h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-[#71675f]">Une organisation intégrée pour préserver la cohérence, la qualité et l’ambition de chaque œuvre.</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {servicePoles.map((pole, index) => {
            const Icon = pole.icon;
            return (
              <article key={pole.number} className={`group overflow-hidden rounded-[2rem] border border-[#ded3c2] p-6 transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(50,38,29,0.10)] sm:p-8 ${index === 0 ? "bg-[#173d2c] text-white md:col-span-2" : "bg-[#fffaf2]"}`}>
                <div className={`grid gap-8 ${index === 0 ? "lg:grid-cols-[0.8fr_1.2fr]" : ""}`}>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`font-display text-sm font-bold ${index === 0 ? "text-[#f2c66f]" : "text-[#c25538]"}`}>PÔLE {pole.number}</span>
                      <span className={`grid h-11 w-11 place-items-center rounded-2xl ${index === 0 ? "bg-white/10 text-[#f2c66f]" : "bg-[#f5e8d0] text-[#a94b34]"}`}><Icon aria-hidden="true" className="h-5 w-5" /></span>
                    </div>
                    <h3 className="mt-8 font-display text-2xl font-bold leading-tight tracking-[-0.035em] sm:text-3xl">{pole.title}</h3>
                    <p className={`mt-3 text-sm font-semibold leading-6 ${index === 0 ? "text-white/58" : "text-[#71675f]"}`}>{pole.mission}</p>
                  </div>
                  <ul className={`grid gap-3 text-sm ${index === 0 ? "sm:grid-cols-2" : ""}`}>
                    {pole.services.map((service) => (
                      <li key={service} className={`flex items-start gap-3 rounded-xl px-3 py-2.5 ${index === 0 ? "bg-white/[0.06] text-white/78" : "bg-[#f5f0e7] text-[#5f574f]"}`}><Check aria-hidden="true" className={`mt-0.5 h-4 w-4 shrink-0 ${index === 0 ? "text-[#f2c66f]" : "text-[#c25538]"}`} />{service}</li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-[#102d21] text-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#f2c66f]">Nos formules</p>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-[-0.04em] sm:text-5xl">Un niveau d’accompagnement adapté à votre ambition.</h2>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <article key={plan.name} className={`rounded-[2rem] border p-7 ${index === 1 ? "border-[#e8ac42] bg-[#e8ac42] text-[#173d2c]" : "border-white/12 bg-white/[0.045]"}`}>
                <p className={`text-xs font-bold uppercase tracking-[0.18em] ${index === 1 ? "text-[#173d2c]/65" : "text-[#f2c66f]"}`}>{plan.label}</p>
                <h3 className="mt-8 font-display text-2xl font-bold">{plan.name}</h3>
                <p className={`mt-4 text-sm leading-7 ${index === 1 ? "text-[#173d2c]/80" : "text-white/62"}`}>{plan.description}</p>
                <Link href="/formation-editoriale" className="mt-8 inline-flex min-h-11 items-center gap-2 text-sm font-bold">Demander une proposition <ChevronRight aria-hidden="true" className="h-4 w-4" /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
        <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#b85139]">Notre processus</p>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-[-0.04em] sm:text-4xl">Une collaboration lisible, du premier échange au suivi.</h2>
            <ol className="mt-9 grid gap-3 sm:grid-cols-2">
              {collaborationSteps.map((step, index) => (
                <li key={step} className="flex items-center gap-4 rounded-2xl border border-[#e7ddd2] bg-white px-4 py-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#fff0eb] text-xs font-bold text-[#b85139]">{index + 1}</span><span className="text-sm font-bold text-[#403933]">{step}</span></li>
              ))}
            </ol>
          </div>
          <aside className="rounded-[2.25rem] bg-[#ede3d7] p-7 sm:p-9">
            <div className="flex items-center gap-3"><ShieldCheck aria-hidden="true" className="h-6 w-6 text-[#b85139]" /><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8d4634]">Nos engagements</p></div>
            <ul className="mt-8 space-y-4">
              {commitments.map((commitment) => (
                <li key={commitment} className="flex items-center gap-3 border-b border-[#d8c9b9] pb-4 text-sm font-bold text-[#403933] last:border-0"><Sparkles aria-hidden="true" className="h-4 w-4 shrink-0 text-[#d45d42]" /> {commitment}</li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section className="px-5 pb-16 sm:px-8 sm:pb-24 lg:px-10">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-[#c95d3e] px-6 py-12 text-white sm:px-12 sm:py-16">
          <Target aria-hidden="true" className="absolute -right-10 -top-10 h-52 w-52 text-white/[0.08]" />
          <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/68">Construisons votre patrimoine intellectuel</p>
              <h2 className="mt-4 font-display text-3xl font-bold leading-tight tracking-[-0.045em] sm:text-5xl">Votre projet mérite une stratégie à sa mesure.</h2>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/82 sm:text-base">Présentez-nous votre idée, votre manuscrit ou le besoin de votre organisation. Notre équipe vous proposera un accompagnement adapté.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link href="/formation-editoriale" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-[#a94430] transition hover:bg-[#fff6f2]">Démarrer mon projet <Send aria-hidden="true" className="h-4 w-4" /></Link>
              <a href="mailto:contact@holistiquebooks.africa" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/35 px-6 text-sm font-bold text-white transition hover:bg-white/10">Nous écrire</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
