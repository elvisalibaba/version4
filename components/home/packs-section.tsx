import { BookOpen, Eye, Star } from "lucide-react";

const packs = [
  {
    badge: "Le moins cher",
    title: "Pack Publication numerique",
    formats: ["Numerique"],
    price: "75 €",
    oldPrice: "147 €",
    icon: Eye,
    audience: "Les auteurs qui veulent publier leur livre a moindre cout.",
  },
  {
    badge: "Le plus vendu",
    title: "Pack Librairies Pro",
    formats: ["Numerique", "Papier"],
    price: "399 €",
    oldPrice: "684 €",
    icon: BookOpen,
    audience: "Les auteurs qui veulent distribuer largement leur ouvrage et recevoir rapidement leurs premiers exemplaires.",
  },
  {
    badge: "Pack Etoile",
    title: "Pack Etoile",
    formats: ["Numerique", "Papier"],
    price: "1989 €",
    oldPrice: "2335 €",
    icon: Star,
    audience: "Les auteurs qui veulent un accompagnement de A a Z de l'edition jusqu'a la publication.",
  },
];

export function PacksSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="space-y-3">
        <p className="ios-kicker">Packs de publication</p>
        <h2 className="ios-title text-3xl font-bold sm:text-4xl">Decouvrez nos packs de publication.</h2>
        <p className="ios-muted max-w-2xl text-sm sm:text-base">
          Des offres claires pour publier a votre rythme, avec la distribution la plus large du marche.
        </p>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {packs.map((pack) => {
          const Icon = pack.icon;
          return (
            <div key={pack.title} className="ios-surface ios-card-hover flex h-full flex-col rounded-3xl p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">{pack.badge}</span>
                  <h3 className="mt-3 text-xl font-semibold text-slate-900">{pack.title}</h3>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white">
                  <Icon className="h-5 w-5" />
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
                {pack.formats.map((format) => (
                  <span key={format} className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 font-semibold">
                    {format}
                  </span>
                ))}
              </div>

              <div className="mt-6">
                <p className="text-3xl font-bold text-slate-900">{pack.price}</p>
                <p className="text-sm text-slate-400 line-through">{pack.oldPrice}</p>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pour qui ?</p>
                <p className="mt-2 text-sm text-slate-600">{pack.audience}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
