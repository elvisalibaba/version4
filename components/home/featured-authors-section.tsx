const authors = [
  { name: "Amina Koffi", specialty: "Leadership", books: 8 },
  { name: "Chinedu Obi", specialty: "Roman social", books: 5 },
  { name: "Grace Okon", specialty: "Foi et discipline", books: 6 },
];

export function FeaturedAuthorsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h2 className="ios-title mb-5 text-2xl font-bold">Nos auteurs du moment</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {authors.map((author) => (
          <article key={author.name} className="ios-surface ios-card-hover rounded-[1.75rem] p-5">
            <div className="mb-3 h-14 w-14 rounded-full bg-gradient-to-br from-rose-100 to-slate-200" />
            <h3 className="ios-title font-semibold">{author.name}</h3>
            <p className="ios-muted text-sm">{author.specialty}</p>
            <p className="mt-2 text-xs text-slate-500">{author.books} livres publies</p>
          </article>
        ))}
      </div>
    </section>
  );
}
