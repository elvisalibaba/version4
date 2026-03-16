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
    title: "Creer votre compte",
    description: "Inscrivez-vous avec votre email pour sauvegarder vos achats, vos lectures gratuites et votre bibliotheque personnelle.",
    icon: UserRoundPlus,
    href: "/register",
    linkLabel: "Ouvrir un compte lecteur",
  },
  {
    title: "Explorer la librairie",
    description: "Parcourez les categories, les auteurs et les titres gratuits ou premium directement depuis la boutique Holistique Books.",
    icon: BookOpenText,
    href: "/books",
    linkLabel: "Voir les livres",
  },
  {
    title: "Acheter ou lire gratuitement",
    description: "Ajoutez un livre payant a votre panier ou demarrez tout de suite avec un titre gratuit quand il est propose.",
    icon: CreditCard,
    href: "/cart",
    linkLabel: "Verifier le panier",
  },
  {
    title: "Retrouver votre bibliotheque",
    description: "Apres achat ou activation, vos livres restent relies a votre compte pour une reprise simple sur le web et les experiences mobiles disponibles.",
    icon: LibraryBig,
    href: "/dashboard/reader",
    linkLabel: "Acceder a ma bibliotheque",
  },
];

const authorJourney: JourneyStep[] = [
  {
    title: "Creer votre espace auteur",
    description: "Inscrivez-vous puis ouvrez votre studio auteur pour gerer votre identite editoriale et votre catalogue.",
    icon: UserRoundPlus,
    href: "/register",
    linkLabel: "Demarrer comme auteur",
  },
  {
    title: "Completer votre profil",
    description: "Ajoutez un nom de plume clair, votre presentation et les informations qui renforcent votre credibilite professionnelle.",
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
    description: "Une fois votre livre publie, vous suivez les acquisitions, les lectures et les performances de votre catalogue dans votre espace auteur.",
    icon: Sparkles,
    href: "/dashboard/author/sales",
    linkLabel: "Consulter les performances",
  },
];

const faqCategories: FaqCategory[] = [
  {
    id: "lecteurs",
    title: "Questions lecteurs",
    description: "Tout le parcours lecteur, depuis l inscription jusqu a la lecture et la recuperation des livres.",
    items: [
      {
        question: "Faut-il creer un compte pour lire sur Holistique Books ?",
        answer:
          "Oui. Le compte permet d associer vos livres, vos acces gratuits et vos achats a votre profil afin que vous puissiez retrouver votre bibliotheque plus tard sans perdre votre progression.",
      },
      {
        question: "Comment recuperer un livre gratuit ?",
        answer:
          "Les livres marques comme gratuits peuvent etre ouverts depuis la librairie. Une fois actives, ces lectures rejoignent votre bibliotheque personnelle comme les autres titres disponibles sur la plateforme.",
      },
      {
        question: "Comment acheter un livre ?",
        answer:
          "Ajoutez le livre au panier, confirmez vos informations de paiement et terminez le checkout. Apres validation du paiement, l acces est rattache a votre compte et le livre apparait dans votre espace lecteur.",
      },
      {
        question: "Ou retrouver mes achats et mes lectures ?",
        answer:
          "Tous vos acces sont centralises dans votre tableau de bord lecteur. Vous y retrouvez vos livres achetes, gratuits ou lies a votre formule d acces lorsque celle-ci existe.",
      },
      {
        question: "Puis-je lire sur mobile ?",
        answer:
          "Oui, Holistique Books prepare et etend l experience mobile autour du meme compte. L objectif est que vous puissiez reprendre vos livres facilement entre le web et les supports mobiles disponibles.",
      },
      {
        question: "Que faire si un paiement ne passe pas ?",
        answer:
          "Verifiez d abord les informations client demandees pendant le paiement, puis recommencez. Si le blocage persiste, contactez le support avec l email du compte et le titre du livre concerne afin de retrouver rapidement la tentative.",
      },
    ],
  },
  {
    id: "auteurs",
    title: "Questions auteurs",
    description: "Le parcours auteur explique comment publier, gerer, corriger et suivre les performances de vos livres.",
    items: [
      {
        question: "Comment devenir auteur sur Holistique Books ?",
        answer:
          "Vous commencez par creer un compte, puis vous accedez au studio auteur. Cet espace vous permet de construire votre catalogue, de presenter votre travail et de suivre vos titres dans une interface dediee.",
      },
      {
        question: "Quels elements preparer avant d ajouter un livre ?",
        answer:
          "Preparez un titre clair, une description convaincante, une couverture propre, vos informations de prix ou de gratuite, ainsi que les elements de presentation utiles pour le lecteur.",
      },
      {
        question: "Comment fonctionne la mise en ligne d un livre ?",
        answer:
          "Le livre est cree dans votre dashboard, puis il suit son cycle de travail selon le statut defini dans la plateforme. Une fois pret et valide selon le workflow en place, il peut etre rendu visible dans la librairie.",
      },
      {
        question: "Puis-je proposer un livre gratuit ?",
        answer:
          "Oui. Holistique Books peut mettre en avant des titres gratuits pour accelerer la decouverte de votre univers, nourrir votre audience et faire entrer de nouveaux lecteurs dans votre catalogue.",
      },
      {
        question: "Ou suivre les ventes, lectures et acquisitions ?",
        answer:
          "Votre tableau de bord auteur rassemble les revenus, les acquisitions recentes, les titres publies et des indicateurs sur la diffusion de votre catalogue.",
      },
      {
        question: "Comment modifier un livre deja publie ?",
        answer:
          "Les ajustements passent par votre espace auteur. Vous pouvez mettre a jour le catalogue, enrichir la presentation et renvoyer une nouvelle version de votre contenu selon le workflow prevu dans l administration du site.",
      },
    ],
  },
  {
    id: "compte-support",
    title: "Compte, support et confiance",
    description: "Les reponses essentielles pour gerer votre acces, vos donnees et les points de support les plus frequents.",
    items: [
      {
        question: "Comment proteger mon compte ?",
        answer:
          "Utilisez un mot de passe unique, gardez votre adresse email accessible et deconnectez-vous des appareils partages. Votre compte reste le point central pour acceder a vos livres et a vos operations.",
      },
      {
        question: "Que contient mon profil ?",
        answer:
          "Votre profil regroupe vos informations d acces et, selon votre role, les donnees utiles a la lecture, aux achats ou a la gestion de votre activite auteur.",
      },
      {
        question: "Ou trouver les informations legales ?",
        answer:
          "Les pages Conditions, Confidentialite et Cookies sont disponibles en permanence dans le footer du site pour expliquer l usage des donnees, les regles de la plateforme et le cadre de navigation.",
      },
      {
        question: "Comment contacter Holistique Books ?",
        answer:
          "Vous pouvez utiliser la zone de contact du site ou l email affiche dans le footer. Pour un traitement rapide, indiquez si vous etes lecteur ou auteur, l email du compte et le livre concerne.",
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
    <section className="hb-faq-page">
      <PageHero
        kicker="Centre d aide"
        title="Tout comprendre sur Holistique Books, cote lecteur comme cote auteur."
        description="Cette page explique le parcours complet: creation de compte, lecture, achats, bibliotheque, publication, gestion du catalogue et suivi professionnel des performances."
        actions={
          <>
            <Link href="/register" className="cta-primary px-5 py-3 text-sm">
              Creer un compte
            </Link>
            <Link href="/dashboard/author" className="cta-secondary px-5 py-3 text-sm">
              Voir le studio auteur
            </Link>
          </>
        }
        aside={
          <div className="hb-faq-quick-panel surface-panel-soft">
            <p className="hb-faq-panel-kicker">Acces rapide</p>
            <div className="hb-faq-link-list">
              {quickLinks.map((link) => (
                <Link key={link.label} href={link.href} className="hb-faq-quick-link">
                  <span>{link.label}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ))}
            </div>
            <div className="hb-faq-note">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Version</p>
              <p className="mt-2 text-base font-semibold text-slate-950">Mars 2026</p>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                Une aide claire pour avancer plus vite, que vous veniez pour lire, acheter, publier ou structurer votre activite d auteur.
              </p>
            </div>
          </div>
        }
      />

      <section className="hb-faq-section">
        <div className="hb-faq-section-header">
          <div>
            <p className="section-kicker">Parcours complets</p>
            <h2 className="section-title text-2xl sm:text-3xl">Depuis la creation du compte jusqu a l usage quotidien.</h2>
          </div>
          <p className="section-description max-w-2xl">
            Holistique Books doit inspirer confiance des la premiere visite. Ces deux parcours montrent clairement comment la plateforme fonctionne pour les lecteurs et pour les auteurs.
          </p>
        </div>

        <div className="hb-faq-journey-grid">
          <section id="lecteurs" className="hb-faq-track surface-panel">
            <div className="hb-faq-track-head">
              <span className="hb-faq-track-badge">Lecteurs</span>
              <h3 className="section-title text-2xl">Lire, acheter et retrouver ses livres sans friction.</h3>
              <p className="section-description">
                Tout est pense pour faire entrer le lecteur vite dans la bonne lecture, puis lui permettre de revenir facilement a sa bibliotheque.
              </p>
            </div>

            <div className="hb-faq-step-list">
              {readerJourney.map((step) => {
                const Icon = step.icon;
                return (
                  <article key={step.title} className="hb-faq-step">
                    <span className="hb-faq-step-icon">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-slate-950">{step.title}</h4>
                      <p className="text-sm leading-7 text-slate-600">{step.description}</p>
                      <Link href={step.href} className="hb-faq-step-link">
                        {step.linkLabel}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section id="auteurs" className="hb-faq-track surface-panel">
            <div className="hb-faq-track-head">
              <span className="hb-faq-track-badge">Auteurs</span>
              <h3 className="section-title text-2xl">Publier, valoriser et suivre son catalogue avec un cadre pro.</h3>
              <p className="section-description">
                Le writer side est pense comme un vrai espace editorial: plus clair, plus credible, plus utile pour piloter vos livres.
              </p>
            </div>

            <div className="hb-faq-step-list">
              {authorJourney.map((step) => {
                const Icon = step.icon;
                return (
                  <article key={step.title} className="hb-faq-step">
                    <span className="hb-faq-step-icon">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-slate-950">{step.title}</h4>
                      <p className="text-sm leading-7 text-slate-600">{step.description}</p>
                      <Link href={step.href} className="hb-faq-step-link">
                        {step.linkLabel}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </section>

      <section className="hb-faq-section">
        <div className="hb-faq-section-header">
          <div>
            <p className="section-kicker">Questions frequentes</p>
            <h2 className="section-title text-2xl sm:text-3xl">Les reponses utiles, sans jargon inutile.</h2>
          </div>
          <p className="section-description max-w-2xl">
            L idee est simple: un lecteur doit comprendre comment lire. Un auteur doit comprendre comment publier, suivre et faire grandir ses livres.
          </p>
        </div>

        <div className="hb-faq-faq-grid">
          {faqCategories.map((category) => (
            <section key={category.id} id={category.id} className="hb-faq-category surface-panel">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CircleHelp className="h-4 w-4 text-[#a85b3f]" />
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a85b3f]">FAQ</p>
                </div>
                <h3 className="section-title text-xl">{category.title}</h3>
                <p className="section-description text-sm">{category.description}</p>
              </div>

              <div className="mt-5">
                {category.items.map((item) => (
                  <details key={item.question} className="hb-faq-item">
                    <summary>{item.question}</summary>
                    <div className="hb-faq-answer">
                      <p>{item.answer}</p>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="hb-faq-support surface-panel-soft">
        <div className="space-y-3">
          <p className="section-kicker">Toujours accompagne</p>
          <h2 className="section-title text-2xl sm:text-3xl">Une plateforme plus claire pour lire, publier et avancer serieusement.</h2>
          <p className="section-description max-w-3xl">
            Si vous etes lecteur, commencez par la librairie ou votre compte. Si vous etes auteur, ouvrez votre studio et structurez votre catalogue. Holistique Books doit donner une impression de confiance des le premier clic.
          </p>
        </div>

        <div className="hb-faq-support-actions">
          <Link href="/books" className="cta-primary px-5 py-3 text-sm">
            Explorer les livres
          </Link>
          <Link href="/register" className="cta-secondary px-5 py-3 text-sm">
            Devenir lecteur ou auteur
          </Link>
        </div>
      </section>
    </section>
  );
}
