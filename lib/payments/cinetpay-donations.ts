import "server-only";

import type { CinetPayChannel, ValidatedCheckoutCustomer } from "./validation";

type CinetPayInitResponse = {
  code?: string;
  message?: string;
  description?: string;
  data?: {
    payment_url?: string;
    payment_token?: string;
    payment_code?: string;
    payment_method?: string;
  };
};

type CinetPayCheckResponse = {
  code?: string;
  message?: string;
  description?: string;
  data?: {
    status?: string;
    amount?: number | string;
    currency?: string;
    payment_method?: string;
    operator_id?: string;
    payment_date?: string;
    transaction_id?: string;
    metadata?: string;
  };
};

export type DonationTransactionStatus = "paid" | "failed" | "pending";

export type DonationVerificationResult = {
  transactionId: string;
  status: DonationTransactionStatus;
  providerStatus: string;
  providerCode: string | null;
  providerMessage: string | null;
  amount: number | null;
  currency: string | null;
  paymentMethod: string | null;
  operatorId: string | null;
  paymentDate: string | null;
  metadata: string | null;
};

export class DonationFlowError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "DonationFlowError";
    this.status = status;
  }
}

function getCinetPayConfig() {
  const apiKey = process.env.CINETPAY_API_KEY;
  const siteId = process.env.CINETPAY_SITE_ID;
  const baseUrl = process.env.CINETPAY_BASE_URL?.replace(/\/$/, "") || "https://api-checkout.cinetpay.com/v2";

  if (!apiKey || !siteId) {
    throw new DonationFlowError("La configuration CinetPay est incomplete cote serveur.", 500);
  }

  return {
    apiKey,
    siteId,
    baseUrl,
  };
}

function resolveAppBaseUrl(fallbackOrigin?: string) {
  const configured = process.env.APP_BASE_URL?.replace(/\/$/, "");

  if (configured) {
    return configured;
  }

  if (fallbackOrigin) {
    return fallbackOrigin.replace(/\/$/, "");
  }

  throw new DonationFlowError("APP_BASE_URL est requis pour construire les URLs CinetPay.", 500);
}

function buildAppUrl(baseUrl: string, path: string) {
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function createDonationTransactionId() {
  const randomSuffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `HB-DON-${Date.now()}-${randomSuffix}`;
}

function toProviderAmount(amount: number) {
  const normalizedAmount = Number(amount.toFixed(2));

  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new DonationFlowError("Montant de don invalide pour CinetPay.", 400);
  }

  return normalizedAmount;
}

function isUsdAccountCompatibilityError(payload: { message?: string; description?: string }) {
  const haystack = `${payload.message ?? ""} ${payload.description ?? ""}`.toLowerCase();
  return haystack.includes("usd") && (haystack.includes("devise") || haystack.includes("currency") || haystack.includes("autor"));
}

async function fetchJson<T>(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  let data: T | null = null;
  try {
    data = (await response.json()) as T;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new DonationFlowError("La passerelle CinetPay est temporairement indisponible.", 502);
  }

  return data;
}

function parseNumericAmount(value: number | string | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Number(value.toFixed(2));
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Number(parsed.toFixed(2));
    }
  }

  return null;
}

export async function initCinetPayDonation(params: {
  amount: number;
  currency: "USD";
  channel: CinetPayChannel;
  customer: ValidatedCheckoutCustomer;
  donorReference?: string;
  note?: string;
  appBaseUrl?: string;
}) {
  const config = getCinetPayConfig();
  const baseUrl = resolveAppBaseUrl(params.appBaseUrl);
  const transactionId = createDonationTransactionId();
  const notePreview = params.note?.slice(0, 80) ?? "";
  const description = notePreview ? `Don HolistiqueBooks - ${notePreview}` : "Don HolistiqueBooks";

  const requestBody: Record<string, unknown> = {
    apikey: config.apiKey,
    site_id: config.siteId,
    transaction_id: transactionId,
    amount: toProviderAmount(params.amount),
    currency: params.currency,
    description,
    notify_url: buildAppUrl(baseUrl, "/api/payments/cinetpay/donate/notify"),
    return_url: buildAppUrl(baseUrl, `/don/retour?transactionId=${encodeURIComponent(transactionId)}`),
    channels: params.channel,
    metadata: JSON.stringify({
      flow: "donation",
      donorReference: params.donorReference ?? null,
      note: params.note ?? null,
      amount: params.amount,
      currency: params.currency,
      createdAt: new Date().toISOString(),
    }),
    customer_id: params.customer.customerId ?? params.donorReference ?? transactionId,
    customer_name: params.customer.lastName,
    customer_surname: params.customer.firstName,
    customer_phone_number: params.customer.phoneNumber,
    customer_email: params.customer.email,
  };

  if (params.channel === "CREDIT_CARD" || params.channel === "ALL") {
    requestBody.customer_address = params.customer.address;
    requestBody.customer_city = params.customer.city;
    requestBody.customer_country = params.customer.country;
    requestBody.customer_state = params.customer.state;
    requestBody.customer_zip_code = params.customer.zipCode;
  }

  const result = await fetchJson<CinetPayInitResponse>(`${config.baseUrl}/payment`, requestBody);
  const paymentUrl = result?.data?.payment_url ?? null;

  if (!paymentUrl) {
    if (isUsdAccountCompatibilityError({ message: result?.message, description: result?.description })) {
      throw new DonationFlowError(
        "Votre compte CinetPay ne semble pas autorise a encaisser en USD. Verifiez la compatibilite devise de votre compte avant la mise en production.",
        409,
      );
    }

    throw new DonationFlowError(result?.description ?? result?.message ?? "CinetPay n a pas retourne de payment_url exploitable.", 502);
  }

  return {
    transactionId,
    paymentUrl,
    responseCode: result?.code ?? null,
    responseMessage: result?.message ?? null,
    responseDescription: result?.description ?? null,
    paymentToken: result?.data?.payment_token ?? null,
    paymentMethod: result?.data?.payment_method ?? result?.data?.payment_code ?? null,
  };
}

export async function verifyCinetPayDonationTransaction(transactionId: string): Promise<DonationVerificationResult> {
  const normalizedTransactionId = transactionId.trim();
  if (!normalizedTransactionId) {
    throw new DonationFlowError("transactionId manquant pour verifier la transaction.", 400);
  }

  const config = getCinetPayConfig();
  const result = await fetchJson<CinetPayCheckResponse>(`${config.baseUrl}/payment/check`, {
    apikey: config.apiKey,
    site_id: config.siteId,
    transaction_id: normalizedTransactionId,
  });

  const providerStatus = result?.data?.status ?? "UNKNOWN";
  const normalizedStatus = providerStatus.toUpperCase();
  const providerCode = result?.code ?? null;

  let status: DonationTransactionStatus = "pending";
  if (providerCode === "00" || normalizedStatus === "ACCEPTED") {
    status = "paid";
  } else if (normalizedStatus === "REFUSED" || normalizedStatus === "FAILED" || normalizedStatus === "CANCELLED") {
    status = "failed";
  }

  return {
    transactionId: normalizedTransactionId,
    status,
    providerStatus,
    providerCode,
    providerMessage: result?.description ?? result?.message ?? null,
    amount: parseNumericAmount(result?.data?.amount),
    currency: result?.data?.currency ?? null,
    paymentMethod: result?.data?.payment_method ?? null,
    operatorId: result?.data?.operator_id ?? null,
    paymentDate: result?.data?.payment_date ?? null,
    metadata: typeof result?.data?.metadata === "string" ? result.data.metadata : null,
  };
}

export function getDonationTransactionIdFromNotifyPayload(payload: Record<string, string>) {
  return payload.cpm_trans_id ?? payload.transaction_id ?? payload.trans_id ?? null;
}
