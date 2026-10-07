/**
 * Identité de l'entreprise, reprise du « Guide de l'entreprise Holistique Books »
 * (28 septembre) et de l'« Offre de services ». Source unique pour l'accueil,
 * les pages institutionnelles et le pied de page.
 */

export const COMPANY = {
  name: "Holistique Books",
  group: "Groupe Holistique SARL",
  slogan: "La révolution transformationnelle de l’écriture",
  signature: "De l’idée à l’impact.",
  founded: 2018,
  formalized: 2024,
  address: ["Immeuble 130", "Commune de la Gombe", "Kinshasa, République démocratique du Congo"],
  phone: "+243 822 338 262",
  phoneHref: "tel:+243822338262",
  email: "contact@holistiquebooks.africa",
  website: "www.holistique-books.com",
  countries: ["RDC", "Togo", "Côte d’Ivoire", "Cameroun"],
} as const;

export type InterventionPole = {
  slug: "ecclesiastique" | "institutionnel" | "entrepreneurial";
  name: string;
  tagline: string;
  audience: string;
  description: string;
  magazine: { name: string; focus: string };
};

/** Les trois pôles d'intervention (vision de l'entreprise). */
export const INTERVENTION_POLES: InterventionPole[] = [
  {
    slug: "ecclesiastique",
    name: "Ecclésiastique",
    tagline: "Édifier, former et transmettre la foi.",
    audience: "Églises, ministères, leaders et organisations chrétiennes",
    description:
      "Nous accompagnons la production et la transmission de contenus qui édifient, forment les croyants et préservent l’enseignement des leaders.",
    magazine: { name: "Metanoia Mag", focus: "Transformation de la vie chrétienne" },
  },
  {
    slug: "institutionnel",
    name: "Institutionnel",
    tagline: "Préserver et valoriser les savoirs.",
    audience: "Institutions, établissements éducatifs, ONG et structures publiques",
    description:
      "Nous concevons, produisons et valorisons les savoirs, expériences et ressources documentaires des organisations.",
    magazine: { name: "Holistique Mag", focus: "Transformation de l’être humain et de la société" },
  },
  {
    slug: "entrepreneurial",
    name: "Entrepreneurial",
    tagline: "Transformer l’expertise en leadership.",
    audience: "Entrepreneurs, entreprises, dirigeants et professionnels",
    description:
      "Nous transformons l’expertise, la vision et l’expérience en contenus qui renforcent l’identité, le leadership et le rayonnement.",
    magazine: { name: "Accélérateur Mag", focus: "Entrepreneuriat · Leadership · Business" },
  },
];

export type PublishingPack = {
  name: string;
  price: string;
  copies: string;
  languages: string;
  summary: string;
  includes: string[];
  bonus?: string[];
  tagline: string;
  featured?: boolean;
};

/** Packs transformationnels — offre promotionnelle annuelle. */
export const PUBLISHING_PACKS: PublishingPack[] = [
  {
    name: "Transformation Start",
    price: "1 500 USD",
    copies: "100 exemplaires",
    languages: "Français",
    summary: "Pour l’auteur qui veut transformer son idée en livre professionnel prêt à rencontrer ses premiers lecteurs.",
    includes: [
      "Structuration et accompagnement à l’écriture",
      "Editing, correction et révision",
      "Couverture et mise en page",
      "ISBN, formalités et préparation technique",
      "Impression de 100 exemplaires et publication",
    ],
    bonus: ["Carte d’auteur Holistique Books", "Préparation du vernissage / lancement"],
    tagline: "De votre idée à vos 100 premiers exemplaires.",
  },
  {
    name: "Transformation Expansion",
    price: "3 500 USD",
    copies: "1 000 exemplaires",
    languages: "Français & anglais",
    summary: "Pour passer à une production de plus grande envergure et toucher un lectorat francophone et anglophone.",
    includes: [
      "Conception et édition complète",
      "Adaptation linguistique français / anglais",
      "Design et mise en page",
      "Formalités, production et contrôle qualité",
      "Logistique Chine → Kinshasa",
    ],
    tagline: "Deux langues. 1 000 exemplaires. Une œuvre prête à franchir les frontières.",
    featured: true,
  },
  {
    name: "Transformation Impact",
    price: "7 500 USD",
    copies: "5 000 exemplaires",
    languages: "Français & anglais",
    summary: "Pour les projets à fort potentiel de diffusion, avec une prise en charge globale de l’écosystème du livre.",
    includes: [
      "Édition complète bilingue, design et publication",
      "Impression internationale de 5 000 exemplaires",
      "Logistique, diffusion et distribution",
      "Communication et marketing du livre",
      "Présence sur Amazon et Holistique Books Store",
    ],
    tagline: "Une stratégie de diffusion pensée pour l’impact.",
  },
];

export const COMPANY_VALUES = [
  { name: "Transformation", text: "Chaque production doit porter une possibilité d’impact." },
  { name: "Excellence", text: "La qualité guide chaque étape de notre chaîne éditoriale." },
  { name: "Innovation", text: "Nous associons édition, nouvelles technologies et solutions digitales." },
  { name: "Intégrité", text: "Nous respectons nos engagements, nos clients et la propriété intellectuelle." },
  { name: "Créativité", text: "Nous donnons aux idées une forme originale, pertinente et adaptée à leurs publics." },
  { name: "Collaboration", text: "Nous réunissons auteurs, experts, Églises, institutions et entreprises." },
];

export const COMPANY_TEAM = [
  { name: "Gode Muala", role: "Directeur général & Éditeur en chef" },
  { name: "Gladys Mbiya", role: "Responsable administrative" },
  { name: "Daniel", role: "Ingénieur informaticien" },
  { name: "Elvis Makasi", role: "Chargé du développement & Community Manager" },
  { name: "Gaston Siboko", role: "Responsable événementiel" },
];

export const NATIONAL_EDITORS = [
  { country: "RDC", name: "Gode Muala", role: "Siège central et coordination générale" },
  { country: "Togo", name: "Pasteur Jean", role: "Éditeur national" },
  { country: "Côte d’Ivoire", name: "Pasteur Yapo Athanase", role: "Éditeur national" },
  { country: "Cameroun", name: "Pasteur Serge Nkoti", role: "Éditeur national" },
];
