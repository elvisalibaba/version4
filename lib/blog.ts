export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  tag: string;
  date: string;
  dateLabel: string;
  author: string;
  readTime: string;
  coverLabel: string;
  content: string[];
};

const posts: BlogPost[] = [
  {
    slug: "manuscrit-qui-se-vend",
    title: "Ecrire un manuscrit qui se vend vraiment",
    excerpt: "Une methode simple pour aligner votre idee, votre audience et votre promesse avant meme la premiere page.",
    tag: "Edition",
    date: "2026-02-28",
    dateLabel: "28 Fev 2026",
    author: "Equipe Holistique",
    readTime: "6 min",
    coverLabel: "Image auteur",
    content: [
      "Un bon manuscrit commence par une promesse claire. Avant d'ecrire, posez le probleme que votre livre resout et pour qui.",
      "Travaillez votre angle. Une idee connue peut devenir unique si vous choisissez un point de vue precis et utile.",
      "Structurez votre plan avec trois niveaux: intention, chapitres, actions. Vous ecrirez plus vite et plus propre.",
      "Enfin, testez votre resume en une phrase. Si elle parle a votre lecteur ideal, votre manuscrit est sur la bonne voie.",
    ],
  },
  {
    slug: "couverture-qui-convertit",
    title: "Une couverture qui convertit en 5 decisions",
    excerpt: "Typo, couleurs, contrastes et hierarchie visuelle: les choix qui font cliquer.",
    tag: "Design",
    date: "2026-02-21",
    dateLabel: "21 Fev 2026",
    author: "Studio HB",
    readTime: "5 min",
    coverLabel: "Mockup couverture",
    content: [
      "La miniature est votre vraie vitrine. Pensez a une lecture a 2 metres: contraste et titre lisible sont prioritaires.",
      "Limitez le nombre de couleurs. Deux couleurs dominantes suffisent pour une impression premium.",
      "Choisissez une typographie principale et une secondaire. Trop de polices tue la coherence.",
      "Utilisez un point focal clair. Le regard doit entrer et sortir de la couverture sans effort.",
    ],
  },
  {
    slug: "fixer-le-prix",
    title: "Fixer le prix juste pour un ebook",
    excerpt: "Comment comparer vos concurrents, tester votre marche et proteger votre valeur.",
    tag: "Prix",
    date: "2026-02-12",
    dateLabel: "12 Fev 2026",
    author: "Equipe Holistique",
    readTime: "7 min",
    coverLabel: "Pricing",
    content: [
      "Le bon prix est un equilibre: valeur percue, objectifs financiers et usages de votre audience.",
      "Commencez par analyser 5 titres comparables. Regardez le format, la longueur et la notoriete de l'auteur.",
      "Testez un prix d entree puis montez par paliers. Les promotions doivent creer un effet rarete.",
      "Gardez un prix plancher. Les baisses trop fortes diminuent la perception de qualite.",
    ],
  },
  {
    slug: "strategie-precommande",
    title: "La strategie precommande en 30 jours",
    excerpt: "Un calendrier pour creer l attente, activer vos ambassadeurs et securiser vos ventes.",
    tag: "Marketing",
    date: "2026-02-05",
    dateLabel: "05 Fev 2026",
    author: "Lola Mensah",
    readTime: "8 min",
    coverLabel: "Campagne",
    content: [
      "J-30 a J-15: annoncez votre promesse, publiez un extrait et collectez des emails.",
      "J-14 a J-7: activez vos premiers lecteurs. Les temoignages creent la confiance.",
      "J-6 a J-1: proposez une offre limitee et rappelez la date avec un compte a rebours.",
      "Jour J: un message court, un bouton clair et un suivi rapide des retours.",
    ],
  },
  {
    slug: "kdp-vs-kobo",
    title: "KDP vs Kobo: que choisir pour l Afrique",
    excerpt: "Comparatif pragmatique des plateformes et de la distribution mobile.",
    tag: "Distribution",
    date: "2026-01-29",
    dateLabel: "29 Jan 2026",
    author: "Yann Diop",
    readTime: "6 min",
    coverLabel: "Plateformes",
    content: [
      "KDP est puissant pour l international mais demande un marketing solide pour emerger.",
      "Kobo offre une experience lecture fluide et peut etre plus competitif en recommandations locales.",
      "La cle: votre audience. Si votre public est mobile, pensez a la compatibilite et au prix data.",
      "Testez les deux avec un seul titre, puis comparez vos chiffres sur 60 jours.",
    ],
  },
  {
    slug: "distribution-ecoles-biblios",
    title: "Distribuer vos livres dans les ecoles et biblios",
    excerpt: "Les partenariats qui donnent de la credibilite a votre catalogue.",
    tag: "Partenariats",
    date: "2026-01-20",
    dateLabel: "20 Jan 2026",
    author: "Equipe Holistique",
    readTime: "5 min",
    coverLabel: "Reseau",
    content: [
      "Preparez un dossier simple: resume, objectif pedagogique, format et prix institutionnel.",
      "Identifiez un contact local: direction, professeurs, clubs lecture ou bibliotheques municipales.",
      "Proposez une seance de lecture ou un atelier. L'engagement ouvre la porte aux achats.",
      "Mesurez l impact avec des retours. Cela renforce vos futures negociations.",
    ],
  },
  {
    slug: "lancement-30-jours",
    title: "Plan de lancement en 30 jours",
    excerpt: "Le parcours ideal pour passer de la preparation a la traction.",
    tag: "Lancement",
    date: "2026-01-12",
    dateLabel: "12 Jan 2026",
    author: "Amina Koffi",
    readTime: "9 min",
    coverLabel: "Lancement",
    content: [
      "Semaine 1: clarifiez votre message, construisez la page de vente et vos assets.",
      "Semaine 2: chauffez votre audience avec des extraits, des reels et une page d'inscription.",
      "Semaine 3: ouvrez les ventes, puis organisez un live ou un club lecture.",
      "Semaine 4: analysez les conversions et optimisez la pub ou les partenariats.",
    ],
  },
  {
    slug: "branding-auteur",
    title: "Branding auteur: construire une marque durable",
    excerpt: "Voix, univers et coherence: comment rester memorisable dans un marche sature.",
    tag: "Branding",
    date: "2026-01-04",
    dateLabel: "04 Jan 2026",
    author: "Studio HB",
    readTime: "7 min",
    coverLabel: "Identite",
    content: [
      "Une marque auteur se construit par la repetition d'un message simple et d'un style coherant.",
      "Choisissez une palette et un ton. Ils doivent vivre sur la couverture, le site et les reseaux.",
      "Gardez un rituel de publication pour rester visible. La constance est votre meilleur levier.",
      "Investissez dans une bio courte et une photo professionnelle. C'est votre premiere preuve de serieux.",
    ],
  },
];

export function getAllBlogPosts() {
  return posts;
}

export function getBlogPostBySlug(slug: string) {
  return posts.find((post) => post.slug === slug) ?? null;
}

export function getBlogPreview(count = 4) {
  return posts.slice(0, count);
}
