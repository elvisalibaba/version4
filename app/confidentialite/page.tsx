import { LegalPage } from "@/components/legal/legal-page";

export default function ConfidentialitePage() {
  return (
    <LegalPage
      kicker="Confidentialite"
      title="Politique de confidentialite"
      description="Cette politique explique quelles donnees nous collectons, pourquoi nous les utilisons, comment nous les protegeons et quels sont vos droits."
      lastUpdated="16 mars 2026"
      sections={[
        {
          title: "Données collectées",
          paragraphs: [
            "HolistiqueBooks peut collecter les données nécessaires à la création de compte, à la gestion des commandes, à la livraison des contenus, au support client et à l’amélioration du service.",
            "Cela peut inclure vos informations de profil, vos historiques d’achat, vos accès de lecture, certaines données techniques de navigation et vos préférences déclarées.",
          ],
        },
        {
          title: "Finalites",
          paragraphs: [
            "Les données sont utilisées pour authentifier les utilisateurs, sécuriser les achats, donner accès aux livres, assurer le support, prévenir la fraude, analyser les usages et améliorer l’expérience produit.",
            "Nous pouvons aussi utiliser certaines données pour des communications transactionnelles ou marketing lorsque cela est autorisé par votre choix ou la réglementation applicable.",
          ],
        },
        {
          title: "Partage et sous-traitance",
          paragraphs: [
            "Certaines données peuvent être traitées par des prestataires techniques indispensables au fonctionnement de la plateforme, notamment pour l’hébergement, l’authentification, le stockage, les paiements et l’envoi d’emails.",
            "HolistiqueBooks ne vend pas vos données personnelles. Les accès accordés à des tiers sont limités au strict besoin opérationnel.",
          ],
        },
        {
          title: "Conservation et sécurité",
          paragraphs: [
            "Nous conservons les données pendant la durée nécessaire aux finalités de traitement, à la gestion de la relation utilisateur, au respect des obligations légales et à la résolution des litiges.",
            "Des mesures techniques et organisationnelles raisonnables sont mises en place pour limiter les accès non autorisés, la perte, l’alteration ou la divulgation des données.",
          ],
        },
        {
          title: "Vos droits",
          paragraphs: [
            "Vous pouvez demander l’accès, la correction ou la suppression de certaines données vous concernant, sous réserve des obligations légales et contractuelles applicables.",
            "Vous pouvez également gérer vos préférences de communication et nous contacter pour toute demande liée à la protection de vos données.",
          ],
        },
      ]}
    />
  );
}
