/**
 * Client EasyPay (e-COM Easypay), conforme à la documentation officielle :
 *   1. POST {base}/{mode}/payment/initialization?cid=…&token=…  → { code: 1, reference }
 *   2. Redirection du client : {base}/{mode}/payment/initialization?reference=…
 *   3. GET  {base}/{mode}/payment/{reference}/checking-status    → transaction / payment
 *
 * Module pur (pas de lecture d'environnement, `fetch` injectable) : la configuration et la
 * journalisation sont dans easypay-server.ts. `cid` et `token` ne quittent jamais le serveur.
 */

/** Devises ouvertes au paiement. CDF est prêt (montants entiers) mais fermé au lancement. */
export const CDF_ENABLED = false;
export const ENABLED_CURRENCIES: ReadonlyArray<EasyPayCurrency> = CDF_ENABLED ? ["USD", "CDF"] : ["USD"];

export type EasyPayCurrency = "USD" | "CDF";
export type EasyPayMode = "sandbox" | "v1";
export type EasyPayChannel = "CREDIT CARD" | "MOBILE MONEY";

export type EasyPayConfig = {
  baseUrl: string;
  mode: EasyPayMode;
  cid: string;
  token: string;
};

export type InitPaymentInput = {
  orderRef: string;
  amount: number;
  currency: EasyPayCurrency;
  description: string;
  successUrl: string;
  errorUrl: string;
  cancelUrl: string;
  customerName: string;
  customerEmail?: string | null;
  channels?: EasyPayChannel[];
};

export type InitPaymentResult =
  | { ok: true; reference: string; request: Record<string, unknown>; response: unknown }
  | { ok: false; message: string; request: Record<string, unknown>; response: unknown; httpStatus: number | null };

export type ProviderStatus = "SUCCESS" | "PENDING" | "FAILED" | "CANCELED" | "UNKNOWN";

export type CheckStatusResult = {
  ok: boolean;
  httpStatus: number | null;
  orderRef: string | null;
  transactionReference: string | null;
  status: ProviderStatus;
  rawStatus: string | null;
  channel: string | null;
  paymentReference: string | null;
  amount: number | null;
  currency: string | null;
  message: string | null;
  response: unknown;
};

export type PaymentDecision = {
  outcome: "paid" | "pending" | "failed" | "needs_review";
  reason: string;
};

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const ORDER_REF = /^[A-Za-z0-9]{6,16}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function modeUrl(config: EasyPayConfig, path: string) {
  return `${config.baseUrl.replace(/\/$/, "")}/${config.mode}/${path.replace(/^\//, "")}`;
}

/** USD : 2 décimales ; CDF : montant entier. */
export function formatAmount(amount: number, currency: EasyPayCurrency): number {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Montant invalide");
  return currency === "CDF" ? Math.round(amount) : Math.round(amount * 100) / 100;
}

/** Description lisible et sans caractères spéciaux refusés par certains canaux. */
export function buildDescription(title: string, formatLabel: string): string {
  const clean = (value: string) => value.replace(/[#$/_&<>"]/g, " ").replace(/\s+/g, " ").trim();
  return `HolisticBooks – ${clean(title).slice(0, 80)} (${clean(formatLabel)})`;
}

/** URL sans identifiants, pour les journaux. */
export function redactUrl(url: string): string {
  try {
    const parsed = new URL(url);
    for (const key of ["cid", "token"]) if (parsed.searchParams.has(key)) parsed.searchParams.set(key, "***");
    return parsed.toString();
  } catch {
    return "[url invalide]";
  }
}

export function buildRedirectUrl(config: EasyPayConfig, reference: string): string {
  return `${modeUrl(config, "/payment/initialization")}?reference=${encodeURIComponent(reference)}`;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function initPayment(
  config: EasyPayConfig,
  input: InitPaymentInput,
  fetchImpl: FetchLike = fetch,
): Promise<InitPaymentResult> {
  if (!ORDER_REF.test(input.orderRef)) throw new Error("order_ref doit faire 6 à 16 caractères alphanumériques");
  if (!input.customerName.trim()) throw new Error("customer_name est obligatoire");

  const body: Record<string, unknown> = {
    order_ref: input.orderRef,
    amount: formatAmount(input.amount, input.currency),
    currency: input.currency,
    description: input.description,
    success_url: input.successUrl,
    error_url: input.errorUrl,
    cancel_url: input.cancelUrl,
    language: "FR",
    channels: (input.channels?.length ? input.channels : ["CREDIT CARD", "MOBILE MONEY"]).map((channel) => ({ channel })),
    customer_name: input.customerName.trim().slice(0, 120),
  };
  if (input.customerEmail) body.customer_email = input.customerEmail;

  const url = `${modeUrl(config, "/payment/initialization")}?cid=${encodeURIComponent(config.cid)}&token=${encodeURIComponent(config.token)}`;
  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return { ok: false, message: "Passerelle EasyPay injoignable.", request: body, response: null, httpStatus: null };
  }
  const data = await readJson(response);
  const code = isRecord(data) ? text(data.code) : null;
  const reference = isRecord(data) ? text(data.reference) : null;
  if (response.ok && code === "1" && reference) {
    return { ok: true, reference, request: body, response: data };
  }
  const message = (isRecord(data) && text(data.message)) || "EasyPay n'a pas pu initialiser le paiement.";
  return { ok: false, message, request: body, response: data, httpStatus: response.status };
}

function normalizeStatus(raw: string | null): ProviderStatus {
  switch ((raw ?? "").toUpperCase()) {
    case "SUCCESS":
    case "SUCCESSFUL":
    case "PAID":
      return "SUCCESS";
    case "PENDING":
    case "IN_PROGRESS":
    case "PROCESSING":
    case "INITIATED":
      return "PENDING";
    case "FAILED":
    case "FAILURE":
    case "DECLINED":
    case "ERROR":
    case "REJECTED":
      return "FAILED";
    case "CANCELED":
    case "CANCELLED":
      return "CANCELED";
    default:
      return "UNKNOWN";
  }
}

function numberOrNull(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

export async function checkStatus(
  config: EasyPayConfig,
  reference: string,
  fetchImpl: FetchLike = fetch,
): Promise<CheckStatusResult> {
  const url = modeUrl(config, `/payment/${encodeURIComponent(reference)}/checking-status`);
  let response: Response;
  try {
    response = await fetchImpl(url, { method: "GET", headers: { Accept: "application/json" }, cache: "no-store" });
  } catch {
    return {
      ok: false, httpStatus: null, orderRef: null, transactionReference: null, status: "UNKNOWN", rawStatus: null,
      channel: null, paymentReference: null, amount: null, currency: null, message: "Passerelle EasyPay injoignable.", response: null,
    };
  }
  const data = await readJson(response);
  const transaction = isRecord(data) && isRecord(data.transaction) ? data.transaction : {};
  const payment = isRecord(data) && isRecord(data.payment) ? data.payment : {};
  const rawStatus = text(payment.status);
  return {
    ok: response.ok,
    httpStatus: response.status,
    orderRef: text(transaction.order_ref),
    transactionReference: text(transaction.reference),
    status: normalizeStatus(rawStatus),
    rawStatus,
    channel: text(payment.channel),
    paymentReference: text(payment.reference),
    // Le montant n'est pas garanti par la documentation : lu s'il est présent.
    amount: numberOrNull(transaction.amount ?? payment.amount),
    currency: text(transaction.currency ?? payment.currency),
    message: isRecord(data) ? text(data.message) : null,
    response: data,
  };
}

/**
 * Décision de paiement à partir de checking-status. Une commande ne passe à « paid » que si
 * EasyPay confirme SUCCESS pour CETTE référence et CE order_ref, avec montant et devise concordants.
 * Montant absent ou incohérence sur un SUCCESS → needs_review (jamais de validation automatique).
 */
export function decidePayment(
  order: { paymentOrderRef: string; providerReference: string; total: number; currency: EasyPayCurrency },
  check: CheckStatusResult,
): PaymentDecision {
  if (!check.ok) return { outcome: "pending", reason: `checking-status indisponible (HTTP ${check.httpStatus ?? "réseau"})` };
  if (check.transactionReference && check.transactionReference !== order.providerReference) {
    return { outcome: check.status === "SUCCESS" ? "needs_review" : "pending", reason: "référence de transaction différente" };
  }
  if (check.orderRef !== order.paymentOrderRef) {
    return { outcome: check.status === "SUCCESS" ? "needs_review" : "pending", reason: "order_ref différent ou absent" };
  }
  switch (check.status) {
    case "SUCCESS": {
      if (check.amount === null) return { outcome: "needs_review", reason: "montant non renvoyé par EasyPay" };
      if (Math.abs(check.amount - formatAmount(order.total, order.currency)) > 0.009) {
        return { outcome: "needs_review", reason: `montant différent (${check.amount} au lieu de ${order.total})` };
      }
      if (check.currency && check.currency.toUpperCase() !== order.currency) {
        return { outcome: "needs_review", reason: `devise différente (${check.currency})` };
      }
      return { outcome: "paid", reason: "paiement confirmé par checking-status" };
    }
    case "FAILED":
      return { outcome: "failed", reason: "paiement refusé" };
    case "CANCELED":
      return { outcome: "failed", reason: "paiement annulé" };
    case "PENDING":
      return { outcome: "pending", reason: "paiement en cours" };
    default:
      return { outcome: "pending", reason: `statut inconnu (${check.rawStatus ?? "vide"})` };
  }
}
