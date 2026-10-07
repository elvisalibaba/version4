import { LegalPage } from "@/components/legal/legal-page";

export default function CookiesPage() {
  return (
    <LegalPage
      kicker="Cookies"
      title="Politique relative aux cookies"
      description="Cette page explique l utilisation des cookies et technologies similaires sur HolistiqueBooks, ainsi que les choix mis a votre disposition."
      lastUpdated="16 mars 2026"
      sections={[
        {
          title: "Pourquoi nous utilisons des cookies",
          paragraphs: [
            "Les cookies servent à maintenir votre session, à protéger l’authentification, à mémoriser certains choix d’interface et à aider au bon fonctionnement global de la plateforme.",
            "Selon les outils actifs, certains cookies peuvent aussi contribuer à la mesure d’audience, à l’optimisation de l’expérience et à l’evaluation des performances produit.",
          ],
        },
        {
          title: "Types de cookies",
          paragraphs: [
            "Les cookies strictement nécessaires sont indispensables au fonctionnement de la connexion, de la navigation sécurisée et de certaines fonctionnalités essentielles.",
            "Les cookies de mesure ou de personnalisation sont optionnels lorsqu ils ne sont pas indispensables au service principal.",
          ],
        },
        {
          title: "Votre choix",
          paragraphs: [
            "Un bandeau de consentement vous permet d’accepter ou de refuser les cookies optionnels. Votre choix est mémorisé pour éviter de vous solliciter à chaque visite.",
            "Vous pouvez aussi supprimer ou bloquer certains cookies depuis les réglages de votre navigateur, avec le risque que certaines fonctions ne marchent plus correctement.",
          ],
        },
        {
          title: "Base technique actuelle",
          paragraphs: [
            "La plateforme utilise notamment des cookies liés à l’authentification et à la session. Ces cookies restent nécessaires pour vous connecter, protéger votre compte et accéder à vos contenus.",
            "Si de nouveaux services de mesure, de marketing ou de personnalisation sont ajoutés, cette politique devra être mise à jour en conséquence.",
          ],
        },
      ]}
    />
  );
}
