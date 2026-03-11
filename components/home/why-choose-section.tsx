import { BookOpen, PenLine, Quote } from "lucide-react";

const highlights = [
  {
    title: "L'accompagnement",
    description:
      "L'equipe de Holistique Books vous conseille a chaque etape de votre projet et propose un service exclusif d'agent litteraire.",
    icon: Quote,
  },
  {
    title: "La liberte",
    description: "Vous etes libre - pas de contrat ni d'exclusivite - et gardez le controle total de votre oeuvre.",
    icon: BookOpen,
  },
  {
    title: "De nombreux lecteurs",
    description:
      "Vous accedez a un vaste lectorat via 200 sites libraires et 500 librairies physiques et etes lu par notre comite de lecteurs.",
    icon: PenLine,
  },
];

export function WhyChooseSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="ios-surface rounded-[2.5rem] p-6 sm:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <p className="ios-kicker">Pourquoi choisir Holistique Books ?</p>
            <h2 className="ios-title text-3xl font-bold sm:text-4xl">Une maison d'edition engagee aux cotes des auteurs.</h2>
            <p className="ios-muted max-w-2xl text-sm sm:text-base">
              Une equipe editoriale experimentee, une distribution massive et des outils modernes pour publier et vendre vos livres
              sans compromis.
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="ios-surface-strong rounded-3xl p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                </div>
                <p className="ios-muted mt-4 text-sm leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
