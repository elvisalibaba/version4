import { Award, BookHeart, Crown, ShieldCheck, Star, Users } from "lucide-react";

const sections = [
  {
    title: "Notre histoire",
    description: "Une maison d'edition independante nee pour faire emerger les voix africaines et diasporiques.",
    icon: BookHeart,
  },
  {
    title: "L'equipe",
    description: "Editeurs, coachs et experts en diffusion reunis pour porter chaque projet au plus haut niveau.",
    icon: Users,
  },
  {
    title: "Agent Litteraire",
    description: "Un service dedie pour representer votre livre et ouvrir les portes des editeurs partenaires.",
    icon: ShieldCheck,
  },
  {
    title: "Prix des etoiles",
    description: "Nos distinctions internes mettent en lumiere les auteurs les plus prometteurs de notre communaute.",
    icon: Crown,
  },
  {
    title: "Comite de lecteurs",
    description: "Un reseau de lecteurs experts qui selectionne, recommande et soutient les nouvelles publications.",
    icon: Award,
  },
  {
    title: "Temoignages d'auteurs",
    description: "Des retours authentiques d'auteurs accompagnes par Holistique Books sur chaque etape du parcours.",
    icon: Star,
  },
];

export default function QuiSommesNousPage() {
  return (
    <section className="space-y-10">
      <div className="space-y-3">
        <p className="ios-kicker">Qui sommes-nous ?</p>
        <h1 className="ios-title text-3xl font-bold sm:text-4xl">Une maison d'edition premium centree sur les auteurs.</h1>
        <p className="ios-muted max-w-3xl text-sm sm:text-base">
          Notre mission est d'accompagner les auteurs avec rigueur, transparence et un reseau solide de partenaires.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        {sections.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="ios-surface ios-card-hover rounded-3xl p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h2>
              <p className="ios-muted mt-2 text-sm leading-relaxed">{item.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
