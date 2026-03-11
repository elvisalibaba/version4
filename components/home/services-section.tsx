import Link from "next/link";
import { ArrowUpRight, BookOpen, Megaphone, PenLine, Printer, Search, Wand2 } from "lucide-react";

const services = [
  {
    title: "Coaching en ecriture",
    description:
      "Ateliers, coaching individuel et retours editoriaux pour structurer votre manuscrit et gagner du temps.",
    cta: "Tous les services d'accompagnement litteraire",
    icon: PenLine,
  },
  {
    title: "Publier votre livre",
    description:
      "Mise en vente numerique et papier, prix ajustables, distribution large et controle de votre catalogue.",
    cta: "Publier votre livre",
    icon: BookOpen,
  },
  {
    title: "Promouvoir votre livre",
    description:
      "Campagnes digitales, communiques de presse, influenceurs litteraires et strategie de lancement.",
    cta: "Promouvoir un livre",
    icon: Megaphone,
  },
  {
    title: "Ameliorer votre manuscrit",
    description:
      "Correction, relecture et harmonisation du style pour un rendu professionnel et cohérent.",
    cta: "Ameliorer un manuscrit",
    icon: Wand2,
  },
  {
    title: "Imprimer votre livre",
    description:
      "Formats premium, impression a la demande et expédition rapide, des 1 exemplaire.",
    cta: "Imprimer un livre",
    icon: Printer,
  },
  {
    title: "Trouver un editeur",
    description:
      "Soumettez votre manuscrit aux maisons partenaires et beneficiez d'un relais professionnel.",
    cta: "Trouver un editeur",
    icon: Search,
  },
];

export function ServicesSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="space-y-3">
        <p className="ios-kicker">Services sur-mesure</p>
        <h2 className="ios-title text-3xl font-bold sm:text-4xl">Tout ce qu'il faut pour publier comme un editeur.</h2>
        <p className="ios-muted max-w-3xl text-sm sm:text-base">
          Des services a la carte pour ecrire, publier, vendre et promouvoir sans compromis sur la qualite.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
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
