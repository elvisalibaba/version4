import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  CircleHelp,
  CreditCard,
  LibraryBig,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRoundPlus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";

type JourneyStep = {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  linkLabel: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

type FaqCategory = {
  id: string;
  title: string;
  description: string;
  items: FaqItem[];
};

const readerJourney: JourneyStep[] = [
  {
    title: "Créer votre compte",
    description: "Inscrivez-vous avec votre email pour sauvegarder vos achats, vos lectures gratuites et votre bibliothèque personnelle.",
    icon: UserRoundPlus,
    href: "/register",
    linkLabel: "Ouvrir un compte lecteur",
  },
  {
    title: "Explorer la librairie",
    description: "Parcourez les catégories, les auteurs et les titres gratuits ou premium directement depuis la boutique Holistique Books.",
    icon: BookOpenText,
    href: "/books",
    linkLabel: "Voir les livres",
  },
  {
    title: "Acheter ou lire gratuitement",
    description: "Ajoutez un livre payant à votre panier ou démarrez tout de suite avec un titre gratuit quand il est proposé.",
    icon: CreditCard,
    href: "/cart",
    linkLabel: "Vérifier le panier",
  },
  {
    title: "Retrouver votre bibliothèque",
    description: "Après achat ou activation, vos livres restent reliés à votre compte pour une reprise simple sur le web et les expériences mobiles disponibles.",
    icon: LibraryBig,
    href: "/dashboard/reader",
    linkLabel: "Accéder à ma bibliothèque",
  },
];

const authorJourney: JourneyStep[] = [
  {
    title: "Créer votre espace auteur",
    description: "Inscrivez-vous puis ouvrez votre studio auteur pour gérer votre identité éditoriale et votre catalogue.",
    icon: UserRoundPlus,
    href: "/register",
    linkLabel: "Démarrer comme auteur",
  },
  {
    title: "Compléter votre profil",
    description: "Ajoutez un nom de plume clair, votre présentation et les informations qui renforcent votre crédibilité professionnelle.",
    icon: ShieldCheck,
    href: "/dashboard/author",
    linkLabel: "Voir le studio auteur",
  },
  {
    title: "Ajouter un livre",
    description: "Renseignez le titre, la description, la couverture, le prix et le positionnement de votre livre depuis le tableau de bord.",
    icon: Upload,
    href: "/dashboard/author/add-book",
    linkLabel: "Publier un titre",
  },
  {
    title: "Suivre ventes et lectures",
    description: "Une fois votre livre publié, vous suivez les acquisitions, les lectures et les performances de votre catalogue dans votre espace auteur.",
    icon: Sparkles,
    href: "/dashboard/author/sales",
    linkLabel: "Consulter les performances",
  },
];

const faqCategories: FaqCategory[] = [
  {
    id: "lecteurs",
    title: "Questions lecteurs",
    description: "Tout le parcours lecteur, depuis l'inscription jusqu'à la lecture et la récupération des livres.",
    items: [
      {
        question: "Faut-il créer un compte pour lire sur Holistique Books ?",
        answer:
          "Oui. Le compte permet d'associer vos livres, vos accès gratuits et vos achats à votre profil afin que vous puissiez retrouver votre bibliothèque plus tard sans perdre votre progression.",
      },
      {
        question: "Comment récupérer un livre gratuit ?",
        answer:
          "Les livres marqués comme gratuits peuvent être ouverts depuis la librairie. Une fois activés, ces lectures rejoignent votre bibliothèque personnelle comme les autres titres disponibles sur la plateforme.",
      },
      {
        question: "Comment acheter un livre ?",
        answer:
          "Ajoutez le livre au panier, confirmez vos informations de paiement et terminez le checkout. Après validation du paiement, l'accès est rattaché à votre compte et le livre apparaît dans votre espace lecteur.",
      },
      {
        question: "Où retrouver mes achats et mes lectures ?",
        answer:
          "Tous vos accès sont centralisés dans votre tableau de bord lecteur. Vous y retrouvez vos livres achetés, gratuits ou liés à votre formule d'accès lorsque celle-ci existe.",
      },
      {
        question: "Puis-je lire sur mobile ?",
        answer:
          "Oui, Holistique Books prépare et étend l'expérience mobile autour du même compte. L'objectif est que vous puissiez reprendre vos livres facilement entre le web et les supports mobiles disponibles.",
      },
      {
        question: "Que faire si un paiement ne passe pas ?",
        answer:
          "Vérifiez d'abord les informations client demandées pendant le paiement, puis recommencez. Si le blocage persiste, contactez le support avec l'email du compte et le titre du livre concerné afin de retrouver rapidement la tentative.",
      },
    ],
  },
  {
    id: "auteurs",
    title: "Questions auteurs",
    description: "Le parcours auteur expliqué : comment publier, gérer, corriger et suivre les performances de vos livres.",
    items: [
      {
        question: "Comment devenir auteur sur Holistique Books ?",
        answer:
          "Vous commencez par créer un compte, puis vous accédez au studio auteur. Cet espace vous permet de construire votre catalogue, de présenter votre travail et de suivre vos titres dans une interface dédiée.",
      },
      {
        question: "Quels éléments préparer avant d'ajouter un livre ?",
        answer:
          "Préparez un titre clair, une description convaincante, une couverture propre, vos informations de prix ou de gratuité, ainsi que les éléments de présentation utiles pour le lecteur.",
      },
      {
        question: "Comment fonctionne la mise en ligne d'un livre ?",
        answer:
          "Le livre est créé dans votre dashboard, puis il suit son cycle de travail selon le statut défini dans la plateforme. Une fois prêt et validé selon le workflow en place, il peut être rendu visible dans la librairie.",
      },
      {
        question: "Puis-je proposer un livre gratuit ?",
        answer:
          "Oui. Holistique Books peut mettre en avant des titres gratuits pour accélérer la découverte de votre univers, nourrir votre audience et faire entrer de nouveaux lecteurs dans votre catalogue.",
      },
      {
        question: "Où suivre les ventes, lectures et acquisitions ?",
        answer:
          "Votre tableau de bord auteur rassemble les revenus, les acquisitions récentes, les titres publiés et des indicateurs sur la diffusion de votre catalogue.",
      },
      {
        question: "Comment modifier un livre déjà publié ?",
        answer:
          "Les ajustements passent par votre espace auteur. Vous pouvez mettre à jour le catalogue, enrichir la présentation et renvoyer une nouvelle version de votre contenu selon le workflow prévu dans l'administration du site.",
      },
    ],
  },
  {
    id: "compte-support",
    title: "Compte, support et confiance",
    description: "Les réponses essentielles pour gérer votre accès, vos données et les points de support les plus fréquents.",
    items: [
      {
        question: "Comment protéger mon compte ?",
        answer:
          "Utilisez un mot de passe unique, gardez votre adresse email accessible et déconnectez-vous des appareils partagés. Votre compte reste le point central pour accéder à vos livres et à vos opérations.",
      },
      {
        question: "Que contient mon profil ?",
        answer:
          "Votre profil regroupe vos informations d'accès et, selon votre rôle, les données utiles à la lecture, aux achats ou à la gestion de votre activité auteur.",
      },
      {
        question: "Où trouver les informations légales ?",
        answer:
          "Les pages Conditions, Confidentialité et Cookies sont disponibles en permanence dans le footer du site pour expliquer l'usage des données, les règles de la plateforme et le cadre de navigation.",
      },
      {
        question: "Comment contacter Holistique Books ?",
        answer:
          "Vous pouvez utiliser la zone de contact du site ou l'email affiché dans le footer. Pour un traitement rapide, indiquez si vous êtes lecteur ou auteur, l'email du compte et le livre concerné.",
      },
    ],
  },
];

const quickLinks = [
  { label: "Guide lecteur", href: "#lecteurs" },
  { label: "Guide auteur", href: "#auteurs" },
  { label: "Questions compte", href: "#compte-support" },
  { label: "Explorer les livres", href: "/books" },
];

export function FaqPage() {
  return (
    <div className="bg-gray-50">
      <PageHero
        kicker="Centre d'aide"
        title="Tout comprendre sur Holistique Books, côté lecteur comme côté auteur."
        description="Cette page explique le parcours complet : création de compte, lecture, achats, bibliothèque, publication, gestion du catalogue et suivi professionnel des performances."
        actions={
          <>
            <Link
              href="/register"
              className="inline-flex items-center rounded-md bg-[#ff9900] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#e68900] focus:outline-none focus:ring-2 focus:ring-[#ff9900] focus:ring-offset-2"
            >
              Créer un compte
            </Link>
            <Link
              href="/dashboard/author"
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#ff9900] focus:ring-offset-2"
            >
              Voir le studio auteur
            </Link>
          </>
        }
        aside={
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#ff9900]">Accès rapide</p>
            <div className="mt-4 space-y-3">
              {quickLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="flex items-center justify-between text-sm text-gray-700 hover:text-[#ff9900] hover:underline"
                >
                  <span>{link.label}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ))}
            </div>
            <div className="mt-6 border-t border-gray-200 pt-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Version</p>
              <p className="mt-2 text-base font-semibold text-gray-900">Mars 2026</p>
              <p className="mt-2 text-sm text-gray-600">
                Une aide claire pour avancer plus vite, que vous veniez pour lire, acheter, publier ou structurer votre activité d'auteur.
              </p>
            </div>
          </div>
        }
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <section className="space-y-6">
          <div className="space-y-2 text-center sm:text-left">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#ff9900]">Parcours complets</p>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Depuis la création du compte jusqu'à l'usage quotidien.
            </h2>
            <p className="max-w-2xl text-gray-600">
              Holistique Books doit inspirer confiance dès la première visite. Ces deux parcours montrent clairement comment la plateforme fonctionne pour les lecteurs et pour les auteurs.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Lecteurs */}
            <section id="lecteurs" className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="space-y-4">
                <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">Lecteurs</span>
                <h3 className="text-2xl font-bold text-gray-900">Lire, acheter et retrouver ses livres sans friction.</h3>
                <p className="text-gray-600">
                  Tout est pensé pour faire entrer le lecteur vite dans la bonne lecture, puis lui permettre de revenir facilement à sa bibliothèque.
                </p>
              </div>

              <div className="mt-6 space-y-6">
                {readerJourney.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.title} className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900">{step.title}</h4>
                        <p className="text-sm text-gray-600">{step.description}</p>
                        <Link
                          href={step.href}
                          className="inline-flex items-center gap-1 text-sm font-medium text-[#ff9900] hover:underline"
                        >
                          {step.linkLabel}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Auteurs */}
            <section id="auteurs" className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="space-y-4">
                <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">Auteurs</span>
                <h3 className="text-2xl font-bold text-gray-900">Publier, valoriser et suivre son catalogue avec un cadre pro.</h3>
                <p className="text-gray-600">
                  Le writer side est pensé comme un vrai espace éditorial : plus clair, plus crédible, plus utile pour piloter vos livres.
                </p>
              </div>

              <div className="mt-6 space-y-6">
                {authorJourney.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.title} className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900">{step.title}</h4>
                        <p className="text-sm text-gray-600">{step.description}</p>
                        <Link
                          href={step.href}
                          className="inline-flex items-center gap-1 text-sm font-medium text-[#ff9900] hover:underline"
                        >
                          {step.linkLabel}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-2 text-center sm:text-left">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#ff9900]">Questions fréquentes</p>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Les réponses utiles, sans jargon inutile.</h2>
            <p className="max-w-2xl text-gray-600">
              L'idée est simple : un lecteur doit comprendre comment lire. Un auteur doit comprendre comment publier, suivre et faire grandir ses livres.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {faqCategories.map((category) => (
              <section
                key={category.id}
                id={category.id}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CircleHelp className="h-4 w-4 text-[#ff9900]" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#ff9900]">FAQ</p>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{category.title}</h3>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </div>

                <div className="mt-5 space-y-4">
                  {category.items.map((item) => (
                    <details key={item.question} className="border-b border-gray-200 pb-3">
                      <summary className="cursor-pointer text-sm font-medium text-gray-900 hover:text-[#ff9900]">
                        {item.question}
                      </summary>
                      <div className="mt-2 text-sm text-gray-600">
                        <p>{item.answer}</p>
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto max-w-2xl space-y-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#ff9900]">Toujours accompagné</p>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Une plateforme plus claire pour lire, publier et avancer sérieusement.
            </h2>
            <p className="text-gray-600">
              Si vous êtes lecteur, commencez par la librairie ou votre compte. Si vous êtes auteur, ouvrez votre studio et structurez votre catalogue.
              Holistique Books doit donner une impression de confiance dès le premier clic.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Link
                href="/books"
                className="inline-flex items-center rounded-md bg-[#ff9900] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#e68900] focus:outline-none focus:ring-2 focus:ring-[#ff9900] focus:ring-offset-2"
              >
                Explorer les livres
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#ff9900] focus:ring-offset-2"
              >
                Devenir lecteur ou auteur
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}