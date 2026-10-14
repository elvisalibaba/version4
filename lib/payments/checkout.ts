import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getBookFormatLabel } from "@/lib/book-formats";
import type { BookFormatType } from "@/types/api";
import { createServiceRoleClient } from "@/lib/supabase/service";
import {
  buildDescription,
  buildRedirectUrl,
  checkStatus,
  decidePayment,
  ENABLED_CURRENCIES,
  initPayment,
  type EasyPayChannel,
  type EasyPayCurrency,
  type PaymentDecision,
} from "@/lib/payments/easypay";
import { getEasyPayConfig, recordCheck, recordInitAttempt } from "@/lib/payments/easypay-server";

/** Erreur présentable au client (message en français, statut HTTP). */
export class CheckoutError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "CheckoutError";
  }
}

export const PAYMENT_UNAVAILABLE = "Paiement momentanément indisponible. Réessayez dans quelques minutes.";
/** Une commande non payée au bout de 48 h expire (réconciliation planifiée). */
export const PENDING_LIFETIME_MS = 48 * 60 * 60 * 1000;
/** Une redirection EasyPay déjà émise est réutilisée pendant 30 min (double clic, rechargement). */
const REUSE_REDIRECT_MS = 30 * 60 * 1000;

type OrderRow = {
  id: string;
  user_id: string;
  total_price: number | string;
  currency_code: string;
  payment_status: string;
  payment_order_ref: string | null;
  payment_transaction_id: string | null;
  payment_provider_status: string | null;
  payment_metadata: Record<string, unknown> | null;
  created_at: string;
};

const ORDER_COLUMNS =
  "id,user_id,total_price,currency_code,payment_status,payment_order_ref,payment_transaction_id,payment_provider_status,payment_metadata,created_at";

function service(): SupabaseClient {
  return createServiceRoleClient() as unknown as SupabaseClient;
}

function mapRpcError(error: { code?: string; message: string }): CheckoutError {
  if (error.code === "HB409") return new CheckoutError(error.message, 409);
  if (error.code === "HB422") return new CheckoutError(error.message, 422);
  console.error("[Checkout] hb_create_order :", error.code, error.message);
  return new CheckoutError("Impossible de préparer la commande. Réessayez.", 503);
}

/** Commande en une transaction via la RPC (prix relus en base). Réservé au serveur. */
export async function createOrder(params: {
  userId: string;
  items: Array<{ book_id: string; book_format: string; quantity: number }>;
  currency: string;
  source: "buy_now" | "cart";
}) {
  if (!ENABLED_CURRENCIES.includes(params.currency as EasyPayCurrency)) {
    throw new CheckoutError("Seul le paiement en dollars américains (USD) est ouvert pour le moment.", 422);
  }
  const { data, error } = await service().rpc("hb_create_order", {
    p_user_id: params.userId,
    p_items: params.items,
    p_currency: params.currency,
    p_source: params.source,
  });
  if (error) throw mapRpcError(error);
  const row = (Array.isArray(data) ? data[0] : data) as
    | { order_id: string; payment_order_ref: string; total_price: number; currency_code: string }
    | undefined;
  if (!row) throw new CheckoutError("Impossible de préparer la commande. Réessayez.", 503);
  return row;
}

async function loadOrderForUser(db: SupabaseClient, orderId: string, userId: string): Promise<OrderRow> {
  const { data } = await db.from("orders").select(ORDER_COLUMNS).eq("id", orderId).maybeSingle();
  const order = data as OrderRow | null;
  if (!order || order.user_id !== userId) throw new CheckoutError("Commande introuvable.", 404);
  return order;
}

function customerNameOf(input: { firstName?: string | null; lastName?: string | null }, profile: Record<string, unknown> | null, email: string | null) {
  const fromForm = `${input.firstName ?? ""} ${input.lastName ?? ""}`.trim();
  if (fromForm) return fromForm;
  const fromProfile = `${(profile?.first_name as string) ?? ""} ${(profile?.last_name as string) ?? ""}`.trim() || ((profile?.name as string) ?? "").trim();
  return fromProfile || email || "";
}

function appBaseUrl(fallbackOrigin: string) {
  return (process.env.APP_BASE_URL?.trim() || fallbackOrigin).replace(/\/$/, "");
}

/**
 * Lance le paiement d'une commande en attente : initialisation EasyPay côté serveur
 * (cid et token jamais exposés), journalisation, URL de redirection.
 */
export async function startEasyPayCheckout(params: {
  userId: string;
  userEmail: string | null;
  orderId: string;
  channel: "ALL" | "MOBILE_MONEY" | "CREDIT_CARD";
  customer: { firstName?: string | null; lastName?: string | null; email?: string | null };
  origin: string;
}): Promise<{ orderId: string; paymentUrl: string; reused: boolean }> {
  const configResult = getEasyPayConfig();
  if (!configResult.ok) throw new CheckoutError(PAYMENT_UNAVAILABLE, 503);
  const { config } = configResult;
  const db = service();
  const order = await loadOrderForUser(db, params.orderId, params.userId);

  if (order.payment_status !== "pending") throw new CheckoutError("Cette commande n'est plus en attente de paiement.", 409);
  if (!order.payment_order_ref) throw new CheckoutError("Recréez votre commande depuis la fiche du livre ou le panier.", 409);
  if (Date.now() - new Date(order.created_at).getTime() > PENDING_LIFETIME_MS) {
    throw new CheckoutError("Cette commande a expiré. Recréez-la depuis la fiche du livre.", 409);
  }
  if (!ENABLED_CURRENCIES.includes(order.currency_code as EasyPayCurrency)) {
    throw new CheckoutError("Seul le paiement en dollars américains (USD) est ouvert pour le moment.", 422);
  }

  // Idempotence : même commande, redirection récente → même paiement EasyPay.
  const initiatedAt = Date.parse(String(order.payment_metadata?.initiated_at ?? ""));
  if (order.payment_provider_status === "INITIATED" && order.payment_transaction_id && Date.now() - initiatedAt < REUSE_REDIRECT_MS) {
    return { orderId: order.id, paymentUrl: buildRedirectUrl(config, order.payment_transaction_id), reused: true };
  }

  const [{ data: profile }, { data: items }] = await Promise.all([
    db.from("profiles").select("first_name,last_name,name").eq("id", params.userId).maybeSingle(),
    db.from("order_items").select("book_id,book_format,books(title)").eq("order_id", order.id),
  ]);
  const customerName = customerNameOf(params.customer, profile as Record<string, unknown> | null, params.customer.email || params.userEmail);
  if (!customerName) throw new CheckoutError("Indiquez votre prénom et votre nom pour payer.", 422);

  const lines = (items ?? []) as Array<{ book_format: string; books: { title?: string } | { title?: string }[] | null }>;
  const firstTitle = (() => {
    const book = lines[0]?.books;
    return (Array.isArray(book) ? book[0]?.title : book?.title) ?? "Livre";
  })();
  const description = lines.length === 1
    ? buildDescription(firstTitle, getBookFormatLabel(lines[0].book_format as BookFormatType))
    : buildDescription(`${lines.length} livres`, "commande");

  const base = appBaseUrl(params.origin);
  const returnUrl = (state: string) => `${base}/payment/return?o=${encodeURIComponent(order.payment_order_ref!)}&etat=${state}`;
  const channels: EasyPayChannel[] | undefined =
    params.channel === "MOBILE_MONEY" ? ["MOBILE MONEY"] : params.channel === "CREDIT_CARD" ? ["CREDIT CARD"] : undefined;
  const total = Number(order.total_price);

  const init = await initPayment(config, {
    orderRef: order.payment_order_ref,
    amount: total,
    currency: order.currency_code as EasyPayCurrency,
    description,
    successUrl: returnUrl("succes"),
    errorUrl: returnUrl("erreur"),
    cancelUrl: returnUrl("annule"),
    customerName,
    customerEmail: params.customer.email || params.userEmail,
    channels,
  });

  await recordInitAttempt(db, {
    userId: params.userId,
    orderId: order.id,
    paymentOrderRef: order.payment_order_ref,
    amount: total,
    currency: order.currency_code,
    requestUrl: `${config.baseUrl}/${config.mode}/payment/initialization?cid=***&token=***`,
    request: init.request,
    response: init.response,
    reference: init.ok ? init.reference : null,
    failure: init.ok ? null : init.message,
  });

  if (!init.ok) {
    await db.from("orders").update({
      payment_provider_status: "INIT_FAILED",
      payment_metadata: { ...(order.payment_metadata ?? {}), init_error: init.message, init_failed_at: new Date().toISOString() },
    }).eq("id", order.id).eq("payment_status", "pending");
    console.error("[EasyPay] Initialisation refusée :", order.payment_order_ref, init.httpStatus, init.message);
    throw new CheckoutError(init.httpStatus === null ? PAYMENT_UNAVAILABLE : `EasyPay : ${init.message}`, 502);
  }

  await db.from("orders").update({
    payment_provider: "easypay",
    payment_transaction_id: init.reference,
    payment_channel: params.channel,
    payment_provider_status: "INITIATED",
    payment_metadata: { ...(order.payment_metadata ?? {}), initiated_at: new Date().toISOString(), mode: config.mode },
  }).eq("id", order.id).eq("payment_status", "pending");

  return { orderId: order.id, paymentUrl: buildRedirectUrl(config, init.reference), reused: false };
}

export type ReconcileResult = {
  orderId: string;
  paymentOrderRef: string | null;
  status: string;
  decision: PaymentDecision | null;
  bookIds: string[];
};

/**
 * Revérifie une commande auprès d'EasyPay (checking-status) avec la référence ENREGISTRÉE en base,
 * jamais celle de l'URL ni d'un callback. Idempotent : la transition n'a lieu que depuis « pending ».
 */
export async function reconcileOrder(
  lookup: { paymentOrderRef: string } | { orderId: string } | { providerReference: string },
  source: "return" | "notify" | "cron" | "admin",
): Promise<ReconcileResult> {
  const db = service();
  let query = db.from("orders").select(ORDER_COLUMNS);
  if ("paymentOrderRef" in lookup) query = query.eq("payment_order_ref", lookup.paymentOrderRef);
  else if ("orderId" in lookup) query = query.eq("id", lookup.orderId);
  else query = query.eq("payment_transaction_id", lookup.providerReference);
  const { data } = await query.maybeSingle();
  const order = data as OrderRow | null;
  if (!order) throw new CheckoutError("Commande introuvable.", 404);

  const { data: itemRows } = await db.from("order_items").select("book_id").eq("order_id", order.id);
  const bookIds = ((itemRows ?? []) as Array<{ book_id: string }>).map((row) => row.book_id);
  const result = (status: string, decision: PaymentDecision | null): ReconcileResult =>
    ({ orderId: order.id, paymentOrderRef: order.payment_order_ref, status, decision, bookIds });

  if (order.payment_status !== "pending") return result(order.payment_status, null);
  const expired = Date.now() - new Date(order.created_at).getTime() > PENDING_LIFETIME_MS;

  if (!order.payment_transaction_id || !order.payment_order_ref) {
    if (!expired) return result("pending", null);
    return result(await transition(db, order, "expired", { outcome: "pending", reason: "aucun paiement initialisé en 48 h" }, source), null);
  }

  const configResult = getEasyPayConfig();
  if (!configResult.ok) return result("pending", null);
  const check = await checkStatus(configResult.config, order.payment_transaction_id);
  const decision = decidePayment(
    {
      paymentOrderRef: order.payment_order_ref,
      providerReference: order.payment_transaction_id,
      total: Number(order.total_price),
      currency: order.currency_code as EasyPayCurrency,
    },
    check,
  );
  await recordCheck(db, { reference: order.payment_transaction_id, check, decision, source });

  const target =
    decision.outcome === "paid" ? "paid"
      : decision.outcome === "failed" ? "failed"
        : decision.outcome === "needs_review" ? "needs_review"
          : expired ? "expired" : "pending";
  if (target === "pending") return result("pending", decision);
  return result(await transition(db, order, target, decision, source, check.rawStatus), decision);
}

/** Transition atomique depuis « pending » + trace d'audit. Un second appel concurrent ne fait rien. */
async function transition(
  db: SupabaseClient,
  order: OrderRow,
  target: "paid" | "failed" | "needs_review" | "expired",
  decision: PaymentDecision,
  source: string,
  providerStatus: string | null = null,
): Promise<string> {
  const now = new Date().toISOString();
  const { data: updated } = await db
    .from("orders")
    .update({
      payment_status: target,
      payment_provider_status: providerStatus ?? order.payment_provider_status,
      payment_verified_at: target === "paid" ? now : null,
      payment_metadata: { ...(order.payment_metadata ?? {}), last_decision: decision, decided_at: now, decided_by: source },
    })
    .eq("id", order.id)
    .eq("payment_status", "pending")
    .select("id");
  if (!updated?.length) {
    // Déjà traitée par un autre appel (retour + réconciliation simultanés) : état actuel.
    const { data } = await db.from("orders").select("payment_status").eq("id", order.id).maybeSingle();
    return (data as { payment_status: string } | null)?.payment_status ?? target;
  }
  await db.from("platform_audit_events").insert({
    actor_id: null,
    action: `order.${target}`,
    entity_type: "order",
    entity_id: order.id,
    severity: target === "needs_review" ? "warning" : "info",
    summary: `Commande ${order.payment_order_ref ?? order.id} : ${decision.reason}`,
    before_state: { payment_status: "pending" },
    after_state: { payment_status: target, provider_status: providerStatus },
    context: { source, payment_order_ref: order.payment_order_ref },
  });
  return target;
}
