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
            "Les cookies servent a maintenir votre session, a proteger l authentification, a memoriser certains choix d interface et a aider au bon fonctionnement global de la plateforme.",
            "Selon les outils actifs, certains cookies peuvent aussi contribuer a la mesure d audience, a l optimisation de l experience et a l evaluation des performances produit.",
          ],
        },
        {
          title: "Types de cookies",
          paragraphs: [
            "Les cookies strictement necessaires sont indispensables au fonctionnement de la connexion, de la navigation securisee et de certaines fonctionnalites essentielles.",
            "Les cookies de mesure ou de personnalisation sont optionnels lorsqu ils ne sont pas indispensables au service principal.",
          ],
        },
        {
          title: "Votre choix",
          paragraphs: [
            "Un bandeau de consentement vous permet d accepter ou de refuser les cookies optionnels. Votre choix est memorise pour eviter de vous solliciter a chaque visite.",
            "Vous pouvez aussi supprimer ou bloquer certains cookies depuis les reglages de votre navigateur, avec le risque que certaines fonctions ne marchent plus correctement.",
          ],
        },
        {
          title: "Base technique actuelle",
          paragraphs: [
            "La plateforme utilise notamment des cookies lies a l authentification et a la session. Ces cookies restent necessaires pour vous connecter, proteger votre compte et acceder a vos contenus.",
            "Si de nouveaux services de mesure, de marketing ou de personnalisation sont ajoutes, cette politique devra etre mise a jour en consequence.",
          ],
        },
      ]}
    />
  );
}
