import { BookOpen, Megaphone, PenLine, Printer, Search, Star, Wand2 } from "lucide-react";

const needs = [
  { title: "Publier un livre", icon: BookOpen },
  { title: "Coaching en ecriture", icon: PenLine },
  { title: "Ameliorer un manuscrit", icon: Wand2 },
  { title: "Imprimer un livre", icon: Printer },
  { title: "Promouvoir un livre", icon: Megaphone },
  { title: "Trouver un editeur", icon: Search },
];

const catalogue = [
  "Packs de services a prix reduits",
  "Services de coaching en ecriture",
  "Services editoriaux",
  "Services de conception du livre",
  "Services de publication",
  "Services d'impression",
  "Services de promotion du livre",
  "Services de relations editeurs",
  "Services livre audio",
];

export default function ServicesPage() {
  return (
    <section className="space-y-10">
      <div className="space-y-3">
        <p className="ios-kicker">Nos services</p>
        <h1 className="ios-title text-3xl font-bold sm:text-4xl">Des solutions completes pour publier, imprimer et vendre.</h1>
        <p className="ios-muted max-w-3xl text-sm sm:text-base">
          Choisissez les services adaptes a votre projet et profitez d'un accompagnement editorial exigeant.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="ios-surface rounded-[2rem] p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="ios-chip rounded-full px-4 py-2 text-xs font-semibold">Selon vos besoins</span>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {needs.map((need) => {
              const Icon = need.icon;
              return (
                <div key={need.title} className="ios-surface-strong rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="text-sm font-semibold text-slate-900">{need.title}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="ios-surface rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
                <Star className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">Pour les professionnels</p>
                <p className="text-xs text-slate-500">Offres sur mesure, accompagnement premium et suivi commercial.</p>
              </div>
            </div>
          </div>

          <div className="ios-surface rounded-2xl p-6">
            <p className="text-sm font-semibold text-slate-900">Notre catalogue complet</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {catalogue.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
