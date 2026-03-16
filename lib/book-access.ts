import { createClient } from "@/lib/supabase/server";
import type { Database, LibraryAccessType, SubscriptionStatus } from "@/types/database";

type MaybeArray<T> = T | T[] | null;

type SubscriptionPlanSummary = Pick<
  Database["public"]["Tables"]["subscription_plans"]["Row"],
  "id" | "name" | "slug" | "monthly_price" | "currency_code"
>;

type UserSubscriptionSummary = Pick<
  Database["public"]["Tables"]["user_subscriptions"]["Row"],
  "id" | "plan_id" | "status" | "expires_at" | "started_at"
> & {
  subscription_plans: MaybeArray<SubscriptionPlanSummary>;
};

type LibraryAccessRow = Pick<
  Database["public"]["Tables"]["library"]["Row"],
  "id" | "purchased_at" | "access_type" | "subscription_id"
> & {
  user_subscriptions: MaybeArray<UserSubscriptionSummary>;
};

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type ReaderBookAccessState = {
  hasAccess: boolean;
  hasPurchaseAccess: boolean;
  hasSubscriptionAccess: boolean;
  hasLibraryEntry: boolean;
  libraryEntry: LibraryAccessRow | null;
  activeSubscription: UserSubscriptionSummary | null;
  isSubscriptionEntitlementExpired: boolean;
};

function firstOf<T>(value: MaybeArray<T>): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function isSubscriptionCurrentlyActive(
  subscription: Pick<Database["public"]["Tables"]["user_subscriptions"]["Row"], "status" | "expires_at"> | null,
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
  supabase?: SupabaseClient;
}): Promise<ReaderBookAccessState> {
  const client = params.supabase ?? (await createClient());
  const uniquePlanIds = Array.from(new Set((params.bookPlanIds ?? []).filter(Boolean)));

  const libraryPromise = client
    .from("library")
    .select(
      "id, purchased_at, access_type, subscription_id, user_subscriptions:subscription_id(id, plan_id, status, expires_at, started_at, subscription_plans(id, name, slug, monthly_price, currency_code))",
    )
    .eq("user_id", params.userId)
    .eq("book_id", params.bookId)
    .returns<LibraryAccessRow>()
    .maybeSingle();

  const rpcPromise = client.rpc("user_has_access_to_book", {
    p_user_id: params.userId,
    p_book_id: params.bookId,
  });

  const subscriptionsPromise =
    uniquePlanIds.length > 0
      ? client
          .from("user_subscriptions")
          .select("id, plan_id, status, expires_at, started_at, subscription_plans(id, name, slug, monthly_price, currency_code)")
          .eq("user_id", params.userId)
          .in("plan_id", uniquePlanIds)
          .returns<UserSubscriptionSummary[]>()
      : Promise.resolve({ data: [] as UserSubscriptionSummary[], error: null });

  const [{ data: libraryData }, { data: rpcResult }, { data: subscriptionsData }] = await Promise.all([
    libraryPromise,
    rpcPromise,
    subscriptionsPromise,
  ]);

  const libraryEntry = (libraryData ?? null) as LibraryAccessRow | null;
  const matchingSubscriptions = (subscriptionsData ?? []) as UserSubscriptionSummary[];
  const activeSubscription = matchingSubscriptions.find((subscription) => isSubscriptionCurrentlyActive(subscription)) ?? null;
  const librarySubscription = firstOf(libraryEntry?.user_subscriptions ?? null);
  const hasPurchaseAccess = libraryEntry?.access_type === "purchase" || libraryEntry?.access_type === "free";
  const hasSubscriptionAccess = Boolean(activeSubscription);
  const hasAccess = Boolean(rpcResult) || hasPurchaseAccess || hasSubscriptionAccess;
  const isSubscriptionEntitlementExpired =
    libraryEntry?.access_type === "subscription" &&
    Boolean(libraryEntry.subscription_id) &&
    !isSubscriptionCurrentlyActive(librarySubscription);

  return {
    hasAccess,
    hasPurchaseAccess,
    hasSubscriptionAccess,
    hasLibraryEntry: Boolean(libraryEntry),
    libraryEntry,
    activeSubscription,
    isSubscriptionEntitlementExpired,
  };
}

export async function syncLibraryAccessEntry(params: {
  userId: string;
  bookId: string;
  currentEntry: ReaderBookAccessState["libraryEntry"];
  activeSubscriptionId?: string | null;
  shouldGrantFreeAccess?: boolean;
  supabase?: SupabaseClient;
}) {
  const client = params.supabase ?? (await createClient());

  if (params.currentEntry?.access_type === "purchase") {
    return;
  }

  let nextAccessType: LibraryAccessType | null = null;
  let nextSubscriptionId: string | null = null;

  if (params.activeSubscriptionId) {
    nextAccessType = "subscription";
    nextSubscriptionId = params.activeSubscriptionId;
  } else if (params.shouldGrantFreeAccess) {
    nextAccessType = "free";
  }

  if (!nextAccessType) return;

  if (
    params.currentEntry?.access_type === nextAccessType &&
    (params.currentEntry.subscription_id ?? null) === nextSubscriptionId
  ) {
    return;
  }

  const payload: Database["public"]["Tables"]["library"]["Insert"] = {
    user_id: params.userId,
    book_id: params.bookId,
    access_type: nextAccessType,
    subscription_id: nextSubscriptionId,
  };

  await client.from("library").upsert(payload, { onConflict: "user_id,book_id" });
}
