const testimonials = [
  {
    name: "Jean",
    city: "Kinshasa",
    message: "Je lis sans interruption, meme hors connexion. La qualite est au rendez-vous.",
    align: "left",
  },
  {
    name: "Nadia",
    city: "Abidjan",
    message: "Paiement Mobile Money en 30 secondes. Tres rassurant.",
    align: "right",
  },
  {
    name: "Eric",
    city: "Lagos",
    message: "J ai trouve des auteurs africains que je ne voyais nulle part ailleurs.",
    align: "left",
  },
];

const partners = ["Afrique Editions", "Media Gospel", "Campus Leaders", "Voix du Livre", "Impact TV"];

export function SocialProofSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="ios-kicker">Preuve sociale</p>
          <h2 className="ios-title text-2xl font-bold">Ils nous font confiance</h2>
          <p className="ios-muted mt-2 max-w-2xl text-sm sm:text-base">
            Une communaute active de lecteurs et d auteurs qui recommandent la plateforme.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {partners.map((partner) => (
            <span key={partner} className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-600">
              {partner}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-3">
          {testimonials.map((item) => (
            <div
              key={item.name}
              className={`max-w-md rounded-2xl px-4 py-3 text-sm shadow-sm ${
                item.align === "right"
                  ? "ml-auto bg-rose-600 text-white"
                  : "mr-auto bg-white/80 text-slate-700"
              }`}
            >
              <p className="font-semibold">
                {item.name} <span className="text-xs opacity-80">- {item.city}</span>
              </p>
              <p className="mt-2 leading-6">{item.message}</p>
            </div>
          ))}
        </div>

        <div className="ios-surface rounded-[2rem] p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Communautes locales</p>
          <h3 className="ios-title mt-3 text-xl font-semibold">Des lecteurs rassures, des auteurs valorises.</h3>
          <p className="ios-muted mt-3 text-sm leading-6">
            Chaque achat soutient directement les auteurs africains. La plateforme redistribue une part majeure du prix
            et garantit une assistance rapide en cas de besoin.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white/70 p-3 text-xs text-slate-600">
              Paiement securise Mobile Money
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/70 p-3 text-xs text-slate-600">
              70% des revenus pour l auteur
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/70 p-3 text-xs text-slate-600">
              Lecture gratuite avant achat
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/70 p-3 text-xs text-slate-600">
              Support local en moins de 2h
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
