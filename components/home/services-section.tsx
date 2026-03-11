import Link from "next/link";
import { ArrowUpRight, BookOpen, Megaphone, PenLine, Printer, Search, Wand2 } from "lucide-react";

const services = [
  {
    title: "Coaching en ecriture",
    description:
      "Faites-vous accompagner dans l'ecriture de votre livre par des experts de l'edition grace a notre atelier en ligne et a nos services personnalises.",
    cta: "Tous les services d'accompagnement litteraire",
    icon: PenLine,
  },
  {
    title: "Publier votre livre",
    description:
      "Commercialisez votre livre numerique et/ou papier, en beneficiant de la distribution la plus large du marche (200 librairies en ligne et 5000 librairies physiques).",
    cta: "Publier votre livre",
    icon: BookOpen,
  },
  {
    title: "Promouvoir votre livre",
    description:
      "Redaction de communique de presse, envoi a des blogueurs specialises, publicite en ligne, organisation de dedicaces.",
    cta: "Promouvoir un livre",
    icon: Megaphone,
  },
  {
    title: "Ameliorer votre manuscrit",
    description:
      "Conseils editoriaux, correction, relecture : des services professionnels pour vous aider dans l'ecriture et la finalisation.",
    cta: "Ameliorer un manuscrit",
    icon: Wand2,
  },
  {
    title: "Imprimer votre livre",
    description:
      "Choisissez parmi nos formats semi-poche, standard et grand format et nous imprimons vos exemplaires a partir de 1.",
    cta: "Imprimer un livre",
    icon: Printer,
  },
  {
    title: "Trouver un editeur",
    description:
      "Grace a notre plateforme de mise en relation auteurs-editeurs, soumettez votre manuscrit a plus de 100 maisons partenaires.",
    cta: "Trouver un editeur",
    icon: Search,
  },
];

export function ServicesSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="space-y-3">
        <p className="ios-kicker">Services sur-mesure</p>
        <h2 className="ios-title text-3xl font-bold sm:text-4xl">Quels que soient vos besoins, Holistique Books vous accompagne.</h2>
        <p className="ios-muted max-w-3xl text-sm sm:text-base">
          Des services a la carte pour chaque etape de votre projet, du premier jet a la promotion en librairie et en ligne.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <div key={service.title} className="ios-surface ios-card-hover flex h-full flex-col rounded-3xl p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="text-lg font-semibold text-slate-900">{service.title}</h3>
              </div>
              <p className="ios-muted mt-4 text-sm leading-relaxed">{service.description}</p>
              <Link href="/services" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-rose-700">
                {service.cta}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
