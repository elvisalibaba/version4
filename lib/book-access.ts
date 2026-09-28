import { apiServer } from "@/lib/api/server";
import type {
  ApiSubscriptionPlan,
  LibraryAccessType,
  SubscriptionStatus,
} from "@/types/api";

type SubscriptionPlanSummary = Pick<
  ApiSubscriptionPlan,
  "id" | "name" | "slug" | "monthly_price" | "currency_code"
>;

type UserSubscriptionSummary = {
  id: string;
  plan_id: string;
  status: SubscriptionStatus;
  expires_at: string | null;
  started_at: string;
  subscription_plans: SubscriptionPlanSummary | null;
};

type LibraryAccessRow = {
  id: string;
  purchased_at: string;
  access_type: LibraryAccessType;
  subscription_id: string | null;
  user_subscriptions: UserSubscriptionSummary | null;
};

export type ReaderBookAccessState = {
  hasAccess: boolean;
  hasPurchaseAccess: boolean;
  hasSubscriptionAccess: boolean;
  hasLibraryEntry: boolean;
  libraryEntry: LibraryAccessRow | null;
  activeSubscription: UserSubscriptionSummary | null;
  isSubscriptionEntitlementExpired: boolean;
};

export function isSubscriptionCurrentlyActive(
  subscription: Pick<UserSubscriptionSummary, "status" | "expires_at"> | null,
) {
  if (!subscription || subscription.status !== "active") return false;
  if (!subscription.expires_at) return true;
  return new Date(subscription.expires_at).getTime() > Date.now();
}

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

export function getBlockedAccessMessage(options: {
  isSingleSaleEnabled: boolean;
  isSubscriptionAvailable: boolean;
}) {
  if (options.isSingleSaleEnabled && options.isSubscriptionAvailable) {
    return "Achetez ce livre ou activez un abonnement Premium pour le lire.";
  }

  if (options.isSubscriptionAvailable) {
    return "Un abonnement Premium actif est requis pour lire ce livre.";
  }

  if (options.isSingleSaleEnabled) {
    return "Achetez ce livre pour commencer la lecture.";
  }

  return "Ce livre n'est pas accessible pour le moment.";
}

export async function getReaderBookAccessState(params: {
  userId: string;
  bookId: string;
  bookPlanIds?: string[];
}): Promise<ReaderBookAccessState> {
  void params.userId;
  void params.bookPlanIds;

  const response = await apiServer<{ data: ReaderBookAccessState }>(
    `books/${encodeURIComponent(params.bookId)}/access`,
  );

  return response.data;
}

export async function syncLibraryAccessEntry(params: {
  userId: string;
  bookId: string;
  currentEntry: ReaderBookAccessState["libraryEntry"];
  activeSubscriptionId?: string | null;
  shouldGrantFreeAccess?: boolean;
}) {
  void params.userId;
  void params.currentEntry;
  void params.activeSubscriptionId;
  void params.shouldGrantFreeAccess;

  // Laravel is now the sole authority for entitlements. Calling the access
  // endpoint re-evaluates purchase/free/subscription rights and synchronizes
  // the library entry through BookAccessService when access is valid.
  await apiServer<{ data: ReaderBookAccessState }>(
    `books/${encodeURIComponent(params.bookId)}/access`,
  );
}
