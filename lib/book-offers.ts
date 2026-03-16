export type BookOfferMode = "sale_only" | "subscription_only" | "sale_and_subscription" | "unavailable";

type BookOfferInput = {
  price: number;
  currencyCode?: string | null;
  isSingleSaleEnabled: boolean;
  isSubscriptionAvailable: boolean;
};

export type BookOfferDetails = {
  normalizedPrice: number;
  currencyCode: string;
  isFree: boolean;
  offerMode: BookOfferMode;
  supportsSingleSale: boolean;
  supportsSubscription: boolean;
  displayPriceLabel: string;
  offerSummaryLabel: string;
};

export function formatMoney(amount: number, currencyCode = "USD") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function resolveBookOfferDetails({
  price,
  currencyCode,
  isSingleSaleEnabled,
  isSubscriptionAvailable,
}: BookOfferInput): BookOfferDetails {
  const normalizedPrice = Number.isFinite(price) ? price : 0;
  const resolvedCurrencyCode = currencyCode?.trim() || "USD";
  const supportsSingleSale = Boolean(isSingleSaleEnabled);
  const supportsSubscription = Boolean(isSubscriptionAvailable);
  const isFree = supportsSingleSale && normalizedPrice <= 0;

  if (supportsSingleSale && supportsSubscription) {
    return {
      normalizedPrice,
      currencyCode: resolvedCurrencyCode,
      isFree,
      offerMode: "sale_and_subscription",
      supportsSingleSale,
      supportsSubscription,
      displayPriceLabel: isFree ? "Gratuit + Premium" : `${formatMoney(normalizedPrice, resolvedCurrencyCode)} + Premium`,
      offerSummaryLabel: "Vente individuelle + Premium",
    };
  }

  if (supportsSubscription) {
    return {
      normalizedPrice,
      currencyCode: resolvedCurrencyCode,
      isFree: false,
      offerMode: "subscription_only",
      supportsSingleSale,
      supportsSubscription,
      displayPriceLabel: "Inclus Premium",
      offerSummaryLabel: "Premium uniquement",
    };
  }

  if (supportsSingleSale) {
    return {
      normalizedPrice,
      currencyCode: resolvedCurrencyCode,
      isFree,
      offerMode: "sale_only",
      supportsSingleSale,
      supportsSubscription,
      displayPriceLabel: isFree ? "Gratuit" : formatMoney(normalizedPrice, resolvedCurrencyCode),
      offerSummaryLabel: isFree ? "Gratuit" : "Vente individuelle",
    };
  }

  return {
    normalizedPrice,
    currencyCode: resolvedCurrencyCode,
    isFree: false,
    offerMode: "unavailable",
    supportsSingleSale,
    supportsSubscription,
    displayPriceLabel: "Indisponible",
    offerSummaryLabel: "Indisponible",
  };
}
