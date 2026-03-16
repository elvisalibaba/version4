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
          title: "Donnees collectees",
          paragraphs: [
            "HolistiqueBooks peut collecter les donnees necessaires a la creation de compte, a la gestion des commandes, a la livraison des contenus, au support client et a l amelioration du service.",
            "Cela peut inclure vos informations de profil, vos historiques d achat, vos acces de lecture, certaines donnees techniques de navigation et vos preferences declarees.",
          ],
        },
        {
          title: "Finalites",
          paragraphs: [
            "Les donnees sont utilisees pour authentifier les utilisateurs, securiser les achats, donner acces aux livres, assurer le support, prevenir la fraude, analyser les usages et ameliorer l experience produit.",
            "Nous pouvons aussi utiliser certaines donnees pour des communications transactionnelles ou marketing lorsque cela est autorise par votre choix ou la reglementation applicable.",
          ],
        },
        {
          title: "Partage et sous-traitance",
          paragraphs: [
            "Certaines donnees peuvent etre traitees par des prestataires techniques indispensables au fonctionnement de la plateforme, notamment pour l hebergement, l authentification, le stockage, les paiements et l envoi d emails.",
            "HolistiqueBooks ne vend pas vos donnees personnelles. Les acces accordes a des tiers sont limites au strict besoin operationnel.",
          ],
        },
        {
          title: "Conservation et securite",
          paragraphs: [
            "Nous conservons les donnees pendant la duree necessaire aux finalites de traitement, a la gestion de la relation utilisateur, au respect des obligations legales et a la resolution des litiges.",
            "Des mesures techniques et organisationnelles raisonnables sont mises en place pour limiter les acces non autorises, la perte, l alteration ou la divulgation des donnees.",
          ],
        },
        {
          title: "Vos droits",
          paragraphs: [
            "Vous pouvez demander l acces, la correction ou la suppression de certaines donnees vous concernant, sous reserve des obligations legales et contractuelles applicables.",
            "Vous pouvez egalement gerer vos preferences de communication et nous contacter pour toute demande liee a la protection de vos donnees.",
          ],
        },
      ]}
    />
  );
}
