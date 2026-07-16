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
            "HolistiqueBooks propose un acces a des livres numeriques, a des contenus editoriaux et a des services lies a la lecture, a l edition et a la distribution de contenus.",
            "En utilisant la plateforme, vous acceptez les presentes conditions dans leur integralite. Si vous n acceptez pas ces conditions, vous ne devez pas utiliser le service.",
          ],
        },
        {
          title: "Compte utilisateur",
          paragraphs: [
            "Certaines fonctionnalites necessitent la creation d un compte. Vous vous engagez a fournir des informations exactes, a proteger vos identifiants et a ne pas partager votre acces de maniere abusive.",
            "Vous etes responsable des activites effectuees depuis votre compte, sauf en cas d acces frauduleux signale sans delai a HolistiqueBooks.",
          ],
        },
        {
          title: "Achats et acces aux livres",
          paragraphs: [
            "Les livres achetes ou obtenus via abonnement donnent un droit d acces personnel, non exclusif et non transferable. Ils ne peuvent pas etre revendus, copies ou redistribues sans autorisation.",
            "Les prix, modalites de paiement, periodes promotionnelles et conditions d abonnement sont affiches avant validation de la commande.",
          ],
        },
        {
          title: "Propriete intellectuelle",
          paragraphs: [
            "Les livres, visuels, textes, extraits, marques et contenus presents sur HolistiqueBooks restent proteges par le droit d auteur et les droits de propriete intellectuelle applicables.",
            "Toute reproduction, extraction massive, diffusion ou exploitation non autorisee est strictement interdite.",
          ],
        },
        {
          title: "Disponibilite et limitation de responsabilite",
          paragraphs: [
            "HolistiqueBooks s efforce d assurer la disponibilite continue de la plateforme, sans pouvoir garantir l absence totale d interruption, de maintenance ou d incident technique.",
            "La responsabilite de HolistiqueBooks ne saurait etre engagee pour des dommages indirects, pertes de donnees, pertes d exploitation ou indisponibilites temporaires independantes de sa volonte raisonnable.",
          ],
        },
        {
          title: "Contact",
          paragraphs: [
            "Pour toute question relative a ces conditions, vous pouvez contacter HolistiqueBooks via les coordonnees mentionnees sur la plateforme ou par email a l adresse de support communiquee.",
          ],
        },
      ]}
    />
  );
}
