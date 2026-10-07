import { LegalPage } from "@/components/legal/legal-page";

export default function ConditionsPage() {
  return (
    <LegalPage
      kicker="Conditions"
      title="Conditions d utilisation de HolistiqueBooks"
      description="Ces conditions encadrent l acces a la plateforme, l achat de livres numeriques, l utilisation de l application et les responsabilites de chaque partie."
      lastUpdated="16 mars 2026"
      sections={[
        {
          title: "Objet",
          paragraphs: [
            "HolistiqueBooks propose un accès à des livres numériques, à des contenus éditoriaux et à des services liés à la lecture, à l’édition et à la distribution de contenus.",
            "En utilisant la plateforme, vous acceptez les présentes conditions dans leur intégralité. Si vous n’acceptez pas ces conditions, vous ne devez pas utiliser le service.",
          ],
        },
        {
          title: "Compte utilisateur",
          paragraphs: [
            "Certaines fonctionnalités nécessitent la création d’un compte. Vous vous engagez à fournir des informations exactes, à protéger vos identifiants et à ne pas partager votre accès de manière abusive.",
            "Vous êtes responsable des activités effectuées depuis votre compte, sauf en cas d’accès frauduleux signalé sans délai à HolistiqueBooks.",
          ],
        },
        {
          title: "Achats et accès aux livres",
          paragraphs: [
            "Les livres achetés ou obtenus via abonnement donnent un droit d’accès personnel, non exclusif et non transférable. Ils ne peuvent pas être revendus, copies ou redistribués sans autorisation.",
            "Les prix, modalités de paiement, périodes promotionnelles et conditions d’abonnement sont affichés avant validation de la commande.",
          ],
        },
        {
          title: "Propriété intellectuelle",
          paragraphs: [
            "Les livres, visuels, textes, extraits, marques et contenus présents sur HolistiqueBooks restent protégés par le droit d’auteur et les droits de propriété intellectuelle applicables.",
            "Toute reproduction, extraction massive, diffusion ou exploitation non autorisée est strictement interdite.",
          ],
        },
        {
          title: "Disponibilité et limitation de responsabilité",
          paragraphs: [
            "HolistiqueBooks s’efforce d’assurer la disponibilité continue de la plateforme, sans pouvoir garantir l’absence totale d’interruption, de maintenance ou d’incident technique.",
            "La responsabilité de HolistiqueBooks ne saurait être engagée pour des dommages indirects, pertes de données, pertes d’exploitation ou indisponibilités temporaires indépendantes de sa volonté raisonnable.",
          ],
        },
        {
          title: "Contact",
          paragraphs: [
            "Pour toute question relative à ces conditions, vous pouvez contacter HolistiqueBooks via les coordonnées mentionnées sur la plateforme ou par email à l’adresse de support communiquée.",
          ],
        },
      ]}
    />
  );
}
