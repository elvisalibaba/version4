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
    description:
      "Inscrivez-vous avec votre email pour sauvegarder vos achats, vos lectures gratuites et votre bibliothèque personnelle.",
    icon: UserRoundPlus,
    href: "/register",
    linkLabel: "Ouvrir un compte lecteur",
  },
  {
    title: "Explorer la librairie",
    description:
      "Parcourez les catégories, les auteurs et les titres gratuits ou premium directement depuis la boutique Holistique Books.",
    icon: BookOpenText,
    href: "/books",
    linkLabel: "Voir les livres",
  },
  {
    title: "Acheter ou lire gratuitement",
    description:
      "Ajoutez un livre payant à votre panier ou démarrez tout de suite avec un titre gratuit quand il est proposé.",
    icon: CreditCard,
    href: "/cart",
    linkLabel: "Vérifier le panier",
  },
  {
    title: "Retrouver votre bibliothèque",
    description:
      "Après achat ou activation, vos livres restent reliés à votre compte pour une reprise simple sur le web et les expériences mobiles disponibles.",
    icon: LibraryBig,
    href: "/dashboard/reader",
    linkLabel: "Accéder à ma bibliothèque",
  },
];

const authorJourney: JourneyStep[] = [
  {
    title: "Créer votre espace auteur",
    description:
      "Inscrivez-vous puis ouvrez votre studio auteur pour gérer votre identité éditoriale et votre catalogue.",
    icon: UserRoundPlus,
    href: "/register",
    linkLabel: "Démarrer comme auteur",
  },
  {
    title: "Compléter votre profil",
    description:
      "Ajoutez un nom de plume clair, votre présentation et les informations qui renforcent votre crédibilité professionnelle.",
    icon: ShieldCheck,
    href: "/dashboard/author",
    linkLabel: "Voir le studio auteur",
  },
  {
    title: "Ajouter un livre",
    description:
      "Renseignez le titre, la description, la couverture, le prix et le positionnement de votre livre depuis le tableau de bord.",
    icon: Upload,
    href: "/dashboard/author/add-book",
    linkLabel: "Publier un titre",
  },
  {
    title: "Suivre ventes et lectures",
    description:
      "Une fois votre livre publié, vous suivez les acquisitions, les lectures et les performances de votre catalogue dans votre espace auteur.",
    icon: Sparkles,
    href: "/dashboard/author/sales",
    linkLabel: "Consulter les performances",
  },
];

const faqCategories: FaqCategory[] = [
  {
    id: "lecteurs",
    title: "Questions lecteurs",
    description:
      "Inscription, lecture, achats, bibliothèque et récupération des livres.",
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
    description:
      "Publication, catalogue, mises à jour et suivi des performances.",
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
    title: "Compte et support",
    description:
      "Accès, données, sécurité et assistance.",
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
  { label: "Compte et support", href: "#compte-support" },
  { label: "Explorer les livres", href: "/books" },
];

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-5 py-4 sm:px-6">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        ) : null}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function JourneyList({
  steps,
  badge,
}: {
  steps: JourneyStep[];
  badge: string;
}) {
  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-full bg-[#fff3e0] px-3 py-1 text-xs font-semibold text-[#b4690e]">
        {badge}
      </div>

      <div className="divide-y divide-gray-200 rounded-lg border border-gray-200">
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <div
              key={step.title}
              className="flex gap-4 p-4 sm:p-5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                <Icon className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500">
                    Étape {index + 1}
                  </span>
                  <h3 className="text-sm font-semibold text-gray-900 sm:text-base">
                    {step.title}
                  </h3>
                </div>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {step.description}
                </p>

                <Link
                  href={step.href}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#ff9900] hover:underline"
                >
                  {step.linkLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function FaqPage() {
  return (
    <div className="min-h-screen bg-[#f3f3f3]">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#cc7a00]">
                Centre d’aide
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Aide Holistique Books
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600 sm:text-base">
                Retrouvez les informations utiles pour créer un compte, lire,
                acheter, publier un livre, gérer votre bibliothèque et utiliser
                votre espace auteur.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="inline-flex items-center rounded-md bg-[#ff9900] px-4 py-2 text-sm font-medium text-white hover:bg-[#e68900] focus:outline-none focus:ring-2 focus:ring-[#ff9900] focus:ring-offset-2"
                >
                  Créer un compte
                </Link>
                <Link
                  href="/books"
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#ff9900] focus:ring-offset-2"
                >
                  Explorer les livres
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-[#fafafa] p-4 sm:p-5">
              <p className="text-sm font-semibold text-gray-900">
                Accès rapides
              </p>

              <div className="mt-4 grid gap-2">
                {quickLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 transition hover:border-[#ff9900] hover:text-[#ff9900]"
                  >
                    <span>{link.label}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ))}
              </div>

              <div className="mt-4 rounded-md border border-gray-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Version
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  Mars 2026
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <SectionCard
          title="Commencer rapidement"
          description="Choisissez le parcours qui correspond à votre usage de la plateforme."
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Link
              href="/register"
              className="rounded-lg border border-gray-200 bg-white p-4 transition hover:border-[#ff9900]"
            >
              <UserRoundPlus className="h-5 w-5 text-[#ff9900]" />
              <p className="mt-3 text-sm font-semibold text-gray-900">
                Créer un compte
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Ouvrir un accès lecteur ou auteur.
              </p>
            </Link>

            <Link
              href="/books"
              className="rounded-lg border border-gray-200 bg-white p-4 transition hover:border-[#ff9900]"
            >
              <BookOpenText className="h-5 w-5 text-[#ff9900]" />
              <p className="mt-3 text-sm font-semibold text-gray-900">
                Voir les livres
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Parcourir la librairie et les catégories.
              </p>
            </Link>

            <Link
              href="/dashboard/reader"
              className="rounded-lg border border-gray-200 bg-white p-4 transition hover:border-[#ff9900]"
            >
              <LibraryBig className="h-5 w-5 text-[#ff9900]" />
              <p className="mt-3 text-sm font-semibold text-gray-900">
                Ma bibliothèque
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Retrouver achats, accès et lectures.
              </p>
            </Link>

            <Link
              href="/dashboard/author"
              className="rounded-lg border border-gray-200 bg-white p-4 transition hover:border-[#ff9900]"
            >
              <Sparkles className="h-5 w-5 text-[#ff9900]" />
              <p className="mt-3 text-sm font-semibold text-gray-900">
                Studio auteur
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Gérer catalogue et performances.
              </p>
            </Link>
          </div>
        </SectionCard>

        <div className="grid gap-8 xl:grid-cols-2">
          <SectionCard
            title="Parcours lecteur"
            description="Lire, acheter et retrouver ses livres facilement."
          >
            <div id="lecteurs">
              <JourneyList steps={readerJourney} badge="Lecteurs" />
            </div>
          </SectionCard>

          <SectionCard
            title="Parcours auteur"
            description="Publier, organiser et suivre son catalogue dans un cadre clair."
          >
            <div id="auteurs">
              <JourneyList steps={authorJourney} badge="Auteurs" />
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title="Questions fréquentes"
          description="Les réponses les plus utiles pour lecteurs, auteurs et gestion du compte."
        >
          <div className="grid gap-6 lg:grid-cols-3">
            {faqCategories.map((category) => (
              <div
                key={category.id}
                id={category.id}
                className="rounded-lg border border-gray-200 bg-[#fcfcfc]"
              >
                <div className="border-b border-gray-200 px-4 py-4">
                  <div className="flex items-center gap-2">
                    <CircleHelp className="h-4 w-4 text-[#ff9900]" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#cc7a00]">
                      FAQ
                    </p>
                  </div>

                  <h3 className="mt-2 text-base font-semibold text-gray-900">
                    {category.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {category.description}
                  </p>
                </div>

                <div className="divide-y divide-gray-200">
                  {category.items.map((item) => (
                    <details key={item.question} className="group px-4 py-4">
                      <summary className="cursor-pointer list-none pr-6 text-sm font-medium text-gray-900 hover:text-[#ff9900]">
                        {item.question}
                      </summary>
                      <p className="mt-3 text-sm leading-6 text-gray-600">
                        {item.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Besoin d’aller plus vite ?
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Accédez directement à la librairie, à votre compte ou à votre espace auteur.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/books"
                className="inline-flex items-center rounded-md bg-[#ff9900] px-4 py-2 text-sm font-medium text-white hover:bg-[#e68900]"
              >
                Explorer les livres
              </Link>
              <Link
                href="/dashboard/author"
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Ouvrir le studio auteur
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}