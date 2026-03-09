const posts = [
  {
    title: "Comment ecrire un ebook qui se vend en Afrique",
    excerpt: "Des etapes concretes pour transformer votre manuscrit en produit digital rentable.",
  },
  {
    title: "Pourquoi la lecture numerique explose au Nigeria et au Ghana",
    excerpt: "Analyse du marche ebook et des nouveaux usages mobiles dans la region.",
  },
  {
    title: "5 erreurs a eviter quand vous fixez le prix d'un ebook",
    excerpt: "Trouver le bon prix pour attirer les lecteurs sans devaluer votre travail.",
  },
];

export function BlogSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h2 className="ios-title mb-5 text-2xl font-bold">Blog & contenu</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {posts.map((post) => (
          <article key={post.title} className="ios-surface ios-card-hover rounded-[1.75rem] p-5">
            <p className="ios-kicker mb-2">Insight</p>
            <h3 className="ios-title font-semibold">{post.title}</h3>
            <p className="ios-muted mt-2 text-sm">{post.excerpt}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
