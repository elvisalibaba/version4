export function AboutSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-10">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-12 items-start">
          {/* Texte principal */}
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#ff9900]">Notre maison d'édition</p>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Une maison d'édition premium et transformationnelle qui accompagne, produit et diffuse avec exigence.
            </h2>
            <p className="text-gray-600">
              Holistique Books connecte les lecteurs, auteurs et éditeurs africains avec un modèle hybride :
              direction éditoriale, fabrication numérique, distribution omnicanale et publicité de livres.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">Édition premium</span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">Protection des œuvres</span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">Distribution digitale</span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">Amazon & librairies</span>
            </div>
          </div>

          {/* Grille des piliers */}
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              {
                title: "Éditorial",
                description: "Coaching, relecture, structuration des manuscrits et ligne éditoriale claire.",
              },
              {
                title: "Production",
                description: "Mise en page, couverture, formats ebook et audiobook avec finitions soignées.",
              },
              {
                title: "Diffusion",
                description: "Librairie en ligne, campagnes de vente et suivi des performances.",
              },
            ].map((pillar) => (
              <div key={pillar.title} className="border-t border-gray-200 pt-4 sm:border-t-0 sm:pt-0">
                <p className="text-sm font-semibold uppercase tracking-wide text-[#ff9900]">{pillar.title}</p>
                <p className="mt-2 text-gray-700">{pillar.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}