export function AboutSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="ios-surface-strong rounded-[2rem] p-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div className="space-y-4">
            <p className="ios-kicker">Notre maison d edition</p>
            <h2 className="ios-title text-2xl font-bold sm:text-3xl">
              Une maison d edition spirituelle et transformationnelle qui accompagne, produit et diffuse avec exigence.
            </h2>
            <p className="ios-muted max-w-2xl">
              Holistique Books connecte les lecteurs, auteurs et editeurs africains avec un modele hybride:
              direction editoriale, fabrication numerique, distribution omnicanale et publicite de livres.
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-slate-600">
              <span className="rounded-full bg-rose-100/70 px-3 py-1 font-semibold text-rose-700">Edition premium</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">Protection des oeuvres</span>
              <span className="rounded-full bg-rose-100/70 px-3 py-1 font-semibold text-rose-700">Distribution digitale</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">Amazon & librairies</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "Editorial",
                description: "Coaching, relecture, structuration des manuscrits et ligne spirituelle claire.",
              },
              {
                title: "Production",
                description: "Mise en page, couverture, formats ebook et audiobook avec finitions soignees.",
              },
              {
                title: "Diffusion",
                description: "Librairie en ligne, campagnes de vente et suivi des performances.",
              },
            ].map((pillar) => (
              <article key={pillar.title} className="ios-surface ios-card-hover rounded-2xl p-4 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">{pillar.title}</p>
                <p className="ios-title mt-2 font-semibold text-slate-900">{pillar.description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
