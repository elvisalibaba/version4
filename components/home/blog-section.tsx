const posts = [
  {
    title: "Comment ecrire un ebook qui se vend en Afrique",
    excerpt: "Des etapes concretes pour transformer votre manuscrit en produit digital rentable.",
    tag: "Edition",
  },
  {
    title: "Pourquoi la lecture numerique explose au Nigeria et au Ghana",
    excerpt: "Analyse du marche ebook et des nouveaux usages mobiles dans la region.",
    tag: "Marche",
  },
  {
    title: "5 erreurs a eviter quand vous fixez le prix d'un ebook",
    excerpt: "Trouver le bon prix pour attirer les lecteurs sans devaluer votre travail.",
    tag: "Prix",
  },
];

export function BlogSection() {
  const [highlight, ...rest] = posts;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="ios-kicker">Magazine editorial</p>
          <h2 className="ios-title text-2xl font-bold">Conseils, tendances et inspiration</h2>
          <p className="ios-muted mt-2 max-w-2xl text-sm sm:text-base">
            Une veille editoriale premium pour aider auteurs et lecteurs a mieux comprendre le marche du livre africain.
          </p>
        </div>
        <span className="text-sm font-semibold text-rose-700">Nouvelles analyses chaque mois</span>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <article className="ios-surface ios-card-hover rounded-[2rem] p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">{highlight.tag}</p>
          <h3 className="ios-title mt-3 text-xl font-semibold sm:text-2xl">{highlight.title}</h3>
          <p className="ios-muted mt-3 text-sm leading-6">{highlight.excerpt}</p>
          <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
            Lire l article
            <span className="text-rose-600">-&gt;</span>
          </div>
        </article>

        <div className="grid gap-4">
          {rest.map((post) => (
            <article key={post.title} className="ios-surface ios-card-hover rounded-[1.75rem] p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">{post.tag}</p>
              <h3 className="ios-title mt-2 font-semibold">{post.title}</h3>
              <p className="ios-muted mt-2 text-sm">{post.excerpt}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
