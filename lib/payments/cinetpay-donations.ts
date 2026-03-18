import "server-only";

import type { CinetPayChannel, ValidatedCheckoutCustomer } from "./validation";

type EasyPayInitResponse = {
  code?: number | string;
  reference?: string;
  message?: string;
};

type EasyPayCheckingResponse = {
  transaction?: {
    order_ref?: string;
    reference?: string;
  };
  payment?: {
    channel?: string;
    status?: string;
    reference?: string;
  };
  message?: string;
};

type EasyPayConfig = {
  baseUrl: string;
  mode: "sandbox" | "v1";
  correlationId: string;
  publishableKey: string;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getEasyPayConfig(): EasyPayConfig {
  const correlationId = process.env.EASYPAY_CORRELATION_ID;
  const publishableKey = process.env.EASYPAY_PUBLISHABLE_KEY;
  const modeRaw = process.env.EASYPAY_MODE?.trim().toLowerCase() ?? "sandbox";
  const baseUrl = process.env.EASYPAY_BASE_URL?.replace(/\/$/, "") || "https://www.e-com-easypay.com";

  if (!correlationId || !publishableKey) {
    throw new DonationFlowError("La configuration EasyPay est incomplete cote serveur.", 500);
  }

  if (modeRaw !== "sandbox" && modeRaw !== "v1") {
    throw new DonationFlowError("EASYPAY_MODE doit etre 'sandbox' ou 'v1'.", 500);
  }

  return {
    baseUrl,
    mode: modeRaw,
    correlationId,
    publishableKey,
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

  throw new DonationFlowError("APP_BASE_URL est requis pour construire les URLs EasyPay.", 500);
}

function buildAppUrl(baseUrl: string, path: string) {
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function buildEasyPayModeUrl(config: EasyPayConfig, path: string) {
  return `${config.baseUrl}/${config.mode}/${path.replace(/^\//, "")}`;
}

function createDonationOrderRef() {
  const randomSuffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `HB-DON-${Date.now()}-${randomSuffix}`;
}

function toProviderAmount(amount: number) {
  const normalizedAmount = Number(amount.toFixed(2));

  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new DonationFlowError("Montant de don invalide pour EasyPay.", 400);
  }

  return normalizedAmount;
}

function mapEasyPayChannels(channel: CinetPayChannel) {
  if (channel === "MOBILE_MONEY") {
    return [{ channel: "MOBILE MONEY" }];
  }

  if (channel === "CREDIT_CARD") {
    return [{ channel: "CREDIT CARD" }];
  }

  return [{ channel: "CREDIT CARD" }, { channel: "MOBILE MONEY" }];
}

function buildCustomerFullName(customer: ValidatedCheckoutCustomer) {
  const fullName = `${customer.firstName} ${customer.lastName}`.trim();
  return fullName || customer.email || "Donateur HolistiqueBooks";
}

async function fetchJson<T>(url: string, body?: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body ?? {}),
    cache: "no-store",
  });

  let data: T | null = null;
  try {
    data = (await response.json()) as T;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new DonationFlowError("La passerelle EasyPay est temporairement indisponible.", 502);
  }

  return data;
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
  const config = getEasyPayConfig();
  const baseUrl = resolveAppBaseUrl(params.appBaseUrl);
  const orderRef = createDonationOrderRef();
  const notePreview = params.note?.slice(0, 80) ?? "";
  const description = notePreview ? `Don HolistiqueBooks - ${notePreview}` : "Don HolistiqueBooks";
  const initUrl = `${buildEasyPayModeUrl(config, "/payment/initialization")}?cid=${encodeURIComponent(config.correlationId)}&token=${encodeURIComponent(config.publishableKey)}`;

  const requestBody: Record<string, unknown> = {
    order_ref: orderRef,
    amount: toProviderAmount(params.amount),
    currency: params.currency,
    description,
    success_url: buildAppUrl(baseUrl, "/don/retour"),
    cancel_url: buildAppUrl(baseUrl, "/don/retour"),
    error_url: buildAppUrl(baseUrl, "/don/retour"),
    language: "FR",
    channels: mapEasyPayChannels(params.channel),
    customer_name: buildCustomerFullName(params.customer),
  };

  if (params.customer.email) {
    requestBody.customer_email = params.customer.email;
  }

  const result = await fetchJson<EasyPayInitResponse>(initUrl, requestBody);
  const responseCode = result?.code !== undefined && result?.code !== null ? String(result.code) : null;
  const responseMessage = cleanString(result?.message);
  const providerReference = cleanString(result?.reference);

  if (responseCode !== "1" || !providerReference) {
    throw new DonationFlowError(responseMessage ?? "EasyPay n a pas pu initialiser la transaction de don.", 502);
  }

  const paymentUrl = `${buildEasyPayModeUrl(config, "/payment/initialization")}?reference=${encodeURIComponent(providerReference)}`;

  return {
    transactionId: providerReference,
    paymentUrl,
    responseCode,
    responseMessage,
    responseDescription: null,
    paymentToken: providerReference,
    paymentMethod: null,
  };
}

export async function verifyCinetPayDonationTransaction(transactionId: string): Promise<DonationVerificationResult> {
  const normalizedTransactionId = transactionId.trim();
  if (!normalizedTransactionId) {
    throw new DonationFlowError("transactionId manquant pour verifier la transaction.", 400);
  }

  const config = getEasyPayConfig();
  const checkUrl = buildEasyPayModeUrl(config, `/payment/${encodeURIComponent(normalizedTransactionId)}/checking-payment`);
  const result = await fetchJson<EasyPayCheckingResponse>(checkUrl, {});

  const providerStatus = (cleanString(result?.payment?.status) ?? "UNKNOWN").toUpperCase();

  let status: DonationTransactionStatus = "pending";
  if (providerStatus === "SUCCESS") {
    status = "paid";
  } else if (providerStatus === "CANCELED" || providerStatus === "DECLINED" || providerStatus === "FAILED") {
    status = "failed";
  }

  return {
    transactionId: normalizedTransactionId,
    status,
    providerStatus,
    providerCode: null,
    providerMessage: cleanString(result?.message),
    amount: null,
    currency: null,
    paymentMethod: cleanString(result?.payment?.channel),
    operatorId: null,
    paymentDate: null,
    metadata: JSON.stringify({
      transaction: result?.transaction ?? null,
      payment: result?.payment ?? null,
    }),
  };
}

export function getDonationTransactionIdFromNotifyPayload(payload: unknown) {
  if (!isRecord(payload)) {
    return null;
  }

  const directReference =
    cleanString(payload.reference) ??
    cleanString(payload.cpm_trans_id) ??
    cleanString(payload.transaction_id) ??
    cleanString(payload.trans_id);

  if (directReference) {
    return directReference;
  }

  const transactionPayload = payload.transaction;
  if (isRecord(transactionPayload)) {
    const nestedTransactionReference = cleanString(transactionPayload.reference);
    if (nestedTransactionReference) {
      return nestedTransactionReference;
    }
  }

  const paymentPayload = payload.payment;
  if (isRecord(paymentPayload)) {
    const nestedPaymentReference = cleanString(paymentPayload.reference);
    if (nestedPaymentReference) {
      return nestedPaymentReference;
    }
  }

  return null;
}
