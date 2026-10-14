import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { redactUrl, type CheckStatusResult, type EasyPayConfig, type PaymentDecision } from "@/lib/payments/easypay";

export type EasyPayConfigResult = { ok: true; config: EasyPayConfig } | { ok: false; missing: string[] };

/**
 * Configuration lue UNIQUEMENT dans les variables serveur (jamais NEXT_PUBLIC_*) :
 * EASYPAY_CORRELATION_ID (cid), EASYPAY_TOKEN, EASYPAY_MODE (sandbox | v1), EASYPAY_BASE_URL (facultative).
 * Une variable manquante est journalisée par son nom ; l'interface affiche « Paiement momentanément indisponible ».
 */
export function getEasyPayConfig(): EasyPayConfigResult {
  const cid = process.env.EASYPAY_CORRELATION_ID?.trim();
  const token = process.env.EASYPAY_TOKEN?.trim();
  const mode = process.env.EASYPAY_MODE?.trim().toLowerCase();
  const baseUrl = (process.env.EASYPAY_BASE_URL?.trim() || "https://www.e-com-easypay.com").replace(/\/$/, "");
  const missing: string[] = [];
  if (!cid) missing.push("EASYPAY_CORRELATION_ID");
  if (!token) missing.push("EASYPAY_TOKEN");
  if (mode !== "sandbox" && mode !== "v1") missing.push("EASYPAY_MODE (sandbox | v1)");
  if (!/^https:\/\//.test(baseUrl)) missing.push("EASYPAY_BASE_URL (https)");
  if (missing.length) {
    console.error("[EasyPay] Configuration incomplète, variables :", missing.join(", "));
    return { ok: false, missing };
  }
  return { ok: true, config: { cid: cid!, token: token!, mode: mode as "sandbox" | "v1", baseUrl } };
}

export function isEasyPayConfigured(): boolean {
  return getEasyPayConfig().ok;
}

/** Ligne payment_attempts créée à l'initialisation (sans cid ni token). */
export async function recordInitAttempt(
  service: SupabaseClient,
  params: {
    userId: string;
    orderId: string;
    paymentOrderRef: string;
    amount: number;
    currency: string;
    requestUrl: string;
    request: Record<string, unknown>;
    response: unknown;
    reference: string | null;
    failure: string | null;
  },
) {
  const now = new Date().toISOString();
  const { error } = await service.from("payment_attempts").insert({
    user_id: params.userId,
    order_id: params.orderId,
    provider: "easypay",
    provider_reference: params.reference,
    idempotency_key: `${params.paymentOrderRef}:${crypto.randomUUID()}`,
    amount: params.amount,
    currency_code: params.currency,
    status: params.reference ? "pending" : "failed",
    request_payload: { url: redactUrl(params.requestUrl), body: params.request },
    response_payload: { init: params.response ?? null, checks: [] },
    failed_at: params.reference ? null : now,
    failure_reason: params.failure,
  });
  if (error) console.error("[EasyPay] Journal payment_attempts (initialisation) :", error.message);
}

/** Ajoute le résultat d'une vérification à la tentative (20 dernières conservées). */
export async function recordCheck(
  service: SupabaseClient,
  params: { reference: string; check: CheckStatusResult; decision: PaymentDecision; source: string },
) {
  const { data: attempt } = await service
    .from("payment_attempts")
    .select("id,response_payload")
    .eq("provider", "easypay")
    .eq("provider_reference", params.reference)
    .maybeSingle();
  if (!attempt) return;
  const payload = (attempt.response_payload ?? {}) as { checks?: unknown[] };
  const checks = [
    ...(Array.isArray(payload.checks) ? payload.checks : []),
    {
      at: new Date().toISOString(),
      source: params.source,
      http_status: params.check.httpStatus,
      provider_status: params.check.rawStatus,
      decision: params.decision.outcome,
      reason: params.decision.reason,
      response: params.check.response,
    },
  ].slice(-20);
  const status =
    params.decision.outcome === "paid" ? "paid" : params.decision.outcome === "failed" ? "failed" : "pending";
  const now = new Date().toISOString();
  const { error } = await service
    .from("payment_attempts")
    .update({
      response_payload: { ...payload, checks },
      status,
      verified_at: params.decision.outcome === "paid" ? now : null,
      failed_at: params.decision.outcome === "failed" ? now : null,
      failure_reason: params.decision.outcome === "paid" || params.decision.outcome === "pending" ? null : params.decision.reason,
    })
    .eq("id", attempt.id);
  if (error) console.error("[EasyPay] Journal payment_attempts (vérification) :", error.message);
}
