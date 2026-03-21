export type FooterLink = {
  label: string;
  href: string;
};

export type MarketingPageHighlight = {
  title: string;
  description: string;
};

export type MarketingPageLink = {
  label: string;
  href: string;
};

export type MarketingPageDirectoryGroup = {
  title: string;
  links: FooterLink[];
};

export type MarketingPage = {
  slug: string;
  kicker: string;
  title: string;
  description: string;
  intro: string;
  badges: string[];
  highlights: MarketingPageHighlight[];
  primaryCta: MarketingPageLink;
  secondaryCta?: MarketingPageLink;
  directoryGroups?: MarketingPageDirectoryGroup[];
};

export const footerAboutLinks: FooterLink[] = [
  { label: "A propos de Holistique Books", href: "/qui-sommes-nous" },
  { label: "Equipe editoriale", href: "/equipe-editoriale" },
  { label: "Applications gratuites", href: "/applications-gratuites" },
  { label: "Lecteur Web", href: "/lecteur-web" },
  { label: "Acheter des cartes-cadeaux", href: "/cartes-cadeaux" },
  { label: "Aide", href: "/faq" },
  { label: "Plan du site", href: "/plan-du-site" },
];

export const footerOpportunityLinks: FooterLink[] = [
  { label: "Auto-edition", href: "/auto-edition" },
  { label: "Affilies", href: "/affilies" },
  { label: "Offres d emploi", href: "/offres-d-emploi" },
  { label: "Partenariats", href: "/partenariats" },
  { label: "Achats d entreprise", href: "/achats-entreprise" },
];

export const footerBlogLinks: FooterLink[] = [
  { label: "10 lectures pour mieux vivre 2026", href: "/blog/10-lectures-pour-mieux-vivre-2026" },
  { label: "Selection business et spiritualite", href: "/blog/selection-business-et-spiritualite" },
  { label: "La pile a lire de l equipe Holistique", href: "/blog/pile-a-lire-equipe-holistique" },
  { label: "Des livres pour ralentir et mieux penser", href: "/blog/ralentir-et-mieux-penser" },
  { label: "Voir tous les billets du blog", href: "/blog" },
];

export const footerAccountLinks: FooterLink[] = [
  { label: "Creer un compte lecteur", href: "/register?role=reader" },
  { label: "Creer un espace auteur", href: "/register?role=author" },
];

export const footerLegalLinks: FooterLink[] = [
  { label: "Conditions d utilisation", href: "/conditions" },
  { label: "Politique de confidentialite", href: "/confidentialite" },
  { label: "Parametres cookies", href: "/cookies" },
  { label: "Accessibilite", href: "/accessibilite" },
];

const siteMapGroups: MarketingPageDirectoryGroup[] = [
  {
    title: "Explorer",
    links: [
      { label: "Accueil", href: "/home" },
      { label: "Boutique", href: "/books" },
      { label: "Blog", href: "/blog" },
      { label: "FAQ", href: "/faq" },
      { label: "Qui sommes-nous", href: "/qui-sommes-nous" },
    ],
  },
  {
    title: "Lecteurs",
    links: [
      { label: "Inscription lecteur", href: "/register?role=reader" },
      { label: "Connexion", href: "/login" },
      { label: "Bibliotheque", href: "/dashboard/reader/library" },
      { label: "Premium", href: "/dashboard/reader/subscriptions" },
      { label: "Panier", href: "/cart" },
    ],
  },
  {
    title: "Auteurs",
    links: [
      { label: "Inscription auteur", href: "/register?role=author" },
      { label: "Dashboard auteur", href: "/dashboard/author" },
      { label: "Ajouter un livre", href: "/dashboard/author/add-book" },
      { label: "Mes livres", href: "/dashboard/author/books" },
      { label: "Ventes", href: "/dashboard/author/sales" },
    ],
  },
  {
    title: "Informations",
    links: [...footerAboutLinks, ...footerOpportunityLinks, ...footerLegalLinks],
  },
];

export const marketingPages: Record<string, MarketingPage> = {
  "equipe-editoriale": {
    slug: "equipe-editoriale",
    kicker: "Equipe editoriale",
    title: "Une equipe qui pense catalogue, experience lecteur et traction auteur ensemble.",
    description:
      "Presentation de l equipe editoriale Holistique Books, de sa ligne de selection et de son accompagnement pour les auteurs.",
    intro:
      "Holistique Books rassemble edition, curation et diffusion dans un meme flux de travail pour offrir des livres solides et une experience claire pour chaque public.",
    badges: ["Lecture exigeante", "Validation humaine", "Direction editoriale"],
    highlights: [
      {
        title: "Selection claire",
        description: "Chaque projet est regarde sous l angle du fond, du positionnement et de la lisibilite commerciale.",
      },
      {
        title: "Production propre",
        description: "La preparation des livres, des formats et des extraits reste reliee a votre studio auteur et a votre schema Supabase.",
      },
      {
        title: "Presence continue",
        description: "L equipe nourrit aussi le blog, les mises en avant home et les campagnes de lancement autour du catalogue.",
      },
    ],
    primaryCta: { label: "Decouvrir nos services", href: "/services" },
    secondaryCta: { label: "Ouvrir le studio auteur", href: "/register?role=author" },
  },
  "applications-gratuites": {
    slug: "applications-gratuites",
    kicker: "Applications gratuites",
    title: "Retrouvez Holistique Books sur vos ecrans sans friction.",
    description:
      "Applications et acces gratuits Holistique Books pour lire, suivre sa bibliotheque et retrouver ses contenus sur plusieurs appareils.",
    intro:
      "Le parcours lecteur est pense pour demarrer vite: acces web, mobile et compte personnel relie a votre bibliotheque, vos achats et vos lectures en cours.",
    badges: ["Lecture mobile", "Compte unique", "Acces gratuit"],
    highlights: [
      {
        title: "Lecture continue",
        description: "Passez du navigateur au mobile en gardant votre compte, vos livres et votre historique sous la meme identite.",
      },
      {
        title: "Activation rapide",
        description: "Un simple compte lecteur suffit pour commencer a parcourir le catalogue, lire les gratuits et retrouver vos acquisitions.",
      },
      {
        title: "Base technique stable",
        description: "Le profil lecteur s appuie directement sur vos tables profiles, library, orders et user_subscriptions.",
      },
    ],
    primaryCta: { label: "Creer un compte lecteur", href: "/register?role=reader" },
    secondaryCta: { label: "Explorer la boutique", href: "/books" },
  },
  "lecteur-web": {
    slug: "lecteur-web",
    kicker: "Lecteur Web",
    title: "Un lecteur web simple, rapide et sans distraction.",
    description:
      "Lecteur web Holistique Books pour ouvrir un livre depuis le navigateur, suivre son acces et rester dans un environnement de lecture propre.",
    intro:
      "Le lecteur web est le point d entree naturel pour les lecteurs sur desktop. Il s integre au panier, a la bibliotheque et aux controles d acces deja en place.",
    badges: ["Navigateur", "Acces securise", "Bibliotheque reliee"],
    highlights: [
      {
        title: "Ouverture immediate",
        description: "Le lecteur ouvre les livres eligibles depuis la fiche produit et depuis la bibliotheque sans changer d outil.",
      },
      {
        title: "Suivi des usages",
        description: "Les ouvertures et consultations restent compatibles avec vos evenements de lecture et vos statistiques produit.",
      },
      {
        title: "Experience epuree",
        description: "L interface met le texte au centre pour favoriser la lecture longue et la reprise de session.",
      },
    ],
    primaryCta: { label: "Voir les livres disponibles", href: "/books" },
    secondaryCta: { label: "Creer un compte lecteur", href: "/register?role=reader" },
  },
  "cartes-cadeaux": {
    slug: "cartes-cadeaux",
    kicker: "Cartes-cadeaux",
    title: "Offrez de la lecture, de la formation et des titres qui restent utiles.",
    description:
      "Informations sur les cartes-cadeaux Holistique Books pour offrir un acces simple au catalogue, aux lectures gratuites et aux parcours Premium.",
    intro:
      "Les cartes-cadeaux permettent de partager Holistique Books avec un proche, une equipe ou une communaute sans imposer un titre unique des le depart.",
    badges: ["Usage simple", "Pour particuliers", "Pour equipes"],
    highlights: [
      {
        title: "Un cadeau flexible",
        description: "Laissez le lecteur choisir ses ouvrages, son rythme et ses formats selon ses besoins.",
      },
      {
        title: "Idee corporate",
        description: "Les cartes-cadeaux peuvent aussi soutenir des programmes internes de lecture, de formation et de bien-etre.",
      },
      {
        title: "Activation claire",
        description: "Le compte lecteur reste la cle d entree pour recevoir, activer et utiliser les avantages associes.",
      },
    ],
    primaryCta: { label: "Creer un compte lecteur", href: "/register?role=reader" },
    secondaryCta: { label: "Contacter le support", href: "/faq" },
  },
  "plan-du-site": {
    slug: "plan-du-site",
    kicker: "Plan du site",
    title: "Tout retrouver rapidement sur Holistique Books.",
    description:
      "Plan du site Holistique Books avec les principaux espaces de lecture, de publication, de support et de navigation.",
    intro:
      "Cette page regroupe les entrees les plus utiles pour les lecteurs, les auteurs et les equipes qui pilotent la plateforme.",
    badges: ["Navigation claire", "Lecteurs", "Auteurs"],
    highlights: [
      {
        title: "Un point d entree unique",
        description: "Retrouvez les pages de decouverte, les parcours compte et les espaces dashboard au meme endroit.",
      },
      {
        title: "Moins de liens perdus",
        description: "Le footer et les CTA principaux pointent ici quand un utilisateur veut se reperer rapidement.",
      },
      {
        title: "Base pour le support",
        description: "Le plan du site aide aussi l equipe a orienter les demandes entrantes sans friction.",
      },
    ],
    primaryCta: { label: "Retour a l accueil", href: "/home" },
    secondaryCta: { label: "Ouvrir la FAQ", href: "/faq" },
    directoryGroups: siteMapGroups,
  },
  "auto-edition": {
    slug: "auto-edition",
    kicker: "Auto-edition",
    title: "Passez du manuscrit au catalogue avec un parcours auteur plus net.",
    description:
      "Page de presentation de l auto-edition sur Holistique Books avec creation de compte auteur, studio de publication et mise en ligne du catalogue.",
    intro:
      "Le studio auteur vous aide a creer un profil public, preparer vos livres, choisir les formats utiles et suivre vos soumissions sans eparpiller vos informations.",
    badges: ["Profil auteur", "Catalogue", "Soumission"],
    highlights: [
      {
        title: "Compte auteur dedie",
        description: "Un lien d inscription separe permet de lancer directement le bon role sans confusion avec le parcours lecteur.",
      },
      {
        title: "Schema deja compatible",
        description: "Le flux s appuie sur profiles, author_profiles, books et book_formats pour rester aligne sur votre base existante.",
      },
      {
        title: "Montee en puissance",
        description: "Vous pouvez commencer avec un profil leger puis enrichir la fiche, les extraits et les offres plus tard.",
      },
    ],
    primaryCta: { label: "Creer un espace auteur", href: "/register?role=author" },
    secondaryCta: { label: "Voir le studio auteur", href: "/dashboard/author" },
  },
  affilies: {
    slug: "affilies",
    kicker: "Affilies",
    title: "Un programme affilie lecteur avec portefeuille et attribution claire par livre ou paquet.",
    description:
      "Programme affilies Holistique Books pour lecteurs ambassadeurs avec portefeuille a 2% sur chaque nouvel abonnement actif issu de leur code.",
    intro:
      "Chaque lecteur peut maintenant partager un lien general, un lien livre ou un lien paquet. Quand un nouveau lecteur s abonne, la commission est creditee automatiquement dans le portefeuille d affiliation.",
    badges: ["Portefeuille 2%", "Source livre ou paquet", "Attribution automatique"],
    highlights: [
      {
        title: "Commission simple",
        description: "Le portefeuille lecteur credite 2% sur chaque nouvel abonnement actif attribue a votre code.",
      },
      {
        title: "Suivi par source",
        description: "Le systeme garde la provenance d affiliation par livre ou par paquet pour suivre les campagnes qui convertissent.",
      },
      {
        title: "Dashboard dedie",
        description: "Chaque lecteur retrouve son code, son solde et l historique de ses credits dans son espace affiliation.",
      },
    ],
    primaryCta: { label: "Creer un compte lecteur", href: "/register?role=reader" },
    secondaryCta: { label: "Voir l espace affiliation", href: "/dashboard/reader/affiliations" },
  },
  "offres-d-emploi": {
    slug: "offres-d-emploi",
    kicker: "Offres d emploi",
    title: "Rejoignez une equipe qui construit lecture, edition et outils numeriques ensemble.",
    description:
      "Informations sur les opportunites professionnelles Holistique Books pour edition, operations, marketing et produit.",
    intro:
      "Nous recherchons des profils capables de faire avancer le catalogue, la diffusion et la qualite d execution dans un environnement exigeant mais humain.",
    badges: ["Edition", "Produit", "Croissance"],
    highlights: [
      {
        title: "Profils hybrides",
        description: "Les meilleurs renforts savent relier contenu, operations et experience utilisateur plutot que travailler en silo.",
      },
      {
        title: "Culture de service",
        description: "Chaque role doit contribuer a mieux servir les lecteurs et aider les auteurs a mieux publier.",
      },
      {
        title: "Execution concrete",
        description: "Nous privilegions les personnes qui aiment livrer proprement, documenter et faire progresser les outils existants.",
      },
    ],
    primaryCta: { label: "Mieux connaitre Holistique Books", href: "/qui-sommes-nous" },
    secondaryCta: { label: "Voir les services", href: "/services" },
  },
  partenariats: {
    slug: "partenariats",
    kicker: "Partenariats",
    title: "Construisons des partenariats utiles pour la diffusion, la formation et la lecture.",
    description:
      "Partenariats Holistique Books pour institutions, medias, entreprises, clubs de lecture et structures culturelles.",
    intro:
      "Nous cherchons des partenaires qui veulent rendre les livres plus visibles, plus accessibles et plus utiles dans leurs ecosystemes.",
    badges: ["Institutions", "Media", "Distribution"],
    highlights: [
      {
        title: "Partenariats de contenu",
        description: "Billets, selections thematiques, interviews auteurs et collections edito peuvent nourrir des activations communes.",
      },
      {
        title: "Partenariats de vente",
        description: "Des offres dediees peuvent etre preparees pour les structures qui veulent recommander ou acheter en volume.",
      },
      {
        title: "Partenariats terrain",
        description: "Evenements, ateliers et clubs lecture renforcent la credibilite et la memorisation autour du catalogue.",
      },
    ],
    primaryCta: { label: "Decouvrir les achats d entreprise", href: "/achats-entreprise" },
    secondaryCta: { label: "Ouvrir la FAQ", href: "/faq" },
  },
  "achats-entreprise": {
    slug: "achats-entreprise",
    kicker: "Achats d entreprise",
    title: "Des offres lecture et catalogue pour les equipes, ecoles et organisations.",
    description:
      "Achats d entreprise Holistique Books pour commander des livres, offrir des acces et construire des programmes de lecture utiles.",
    intro:
      "Les achats d entreprise aident a equiper des equipes, des promotions ou des communautes avec des titres alignes sur vos objectifs de formation et de culture.",
    badges: ["B2B", "Lectures utiles", "Volumes adaptes"],
    highlights: [
      {
        title: "Selection ciblee",
        description: "Constituez un panier adapte a un besoin precis: leadership, spiritualite, business, bien-etre ou culture generale.",
      },
      {
        title: "Distribution plus simple",
        description: "Les acces numeriques, les achats unitaires et les recommandations peuvent etre organises autour d un meme parcours.",
      },
      {
        title: "Pont avec les cartes-cadeaux",
        description: "Les organisations peuvent aussi offrir une marge de choix aux beneficiaires plutot qu imposer une lecture unique.",
      },
    ],
    primaryCta: { label: "Explorer le catalogue", href: "/books" },
    secondaryCta: { label: "Voir les cartes-cadeaux", href: "/cartes-cadeaux" },
  },
  accessibilite: {
    slug: "accessibilite",
    kicker: "Accessibilite",
    title: "Rendre la lecture et la navigation plus accessibles fait partie du produit.",
    description:
      "Engagement Holistique Books sur l accessibilite, la lisibilite des parcours et l amelioration continue de l experience web.",
    intro:
      "Nous travaillons a rendre la plateforme plus claire sur mobile et desktop, avec des contrastes lisibles, des actions explicites et des parcours plus stables.",
    badges: ["Lisibilite", "Navigation", "Amelioration continue"],
    highlights: [
      {
        title: "Parcours plus evidents",
        description: "Les zones de compte, de lecture et d aide sont regroupees pour limiter les impasses et les ambiguities.",
      },
      {
        title: "Actions mieux nommees",
        description: "Les CTA distinguent mieux la creation de compte lecteur et auteur, ainsi que les pages de support utiles.",
      },
      {
        title: "Iteration permanente",
        description: "Chaque mise a jour visuelle est une occasion d ameliorer clarte, densite et comprehension globale.",
      },
    ],
    primaryCta: { label: "Voir le plan du site", href: "/plan-du-site" },
    secondaryCta: { label: "Ouvrir la FAQ", href: "/faq" },
  },
};

export function getMarketingPage(slug: string) {
  return marketingPages[slug] ?? null;
}
