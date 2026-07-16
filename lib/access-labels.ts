import type { LibraryAccessType, SubscriptionStatus } from "@/types/database";

export function getLibraryAccessLabel(accessType: LibraryAccessType, hasActiveSubscription = true) {
  if (accessType === "purchase") return "Achat";
  if (accessType === "free") return "Gratuit";
  return hasActiveSubscription ? "Abonnement" : "Abonnement expire";
}

export function getSubscriptionStatusLabel(status: SubscriptionStatus) {
  switch (status) {
    case "active":
      return "Actif";
    case "cancelled":
      return "Annule";
    case "expired":
      return "Expire";
    case "past_due":
      return "Paiement en retard";
    default:
      return status;
  }
}
