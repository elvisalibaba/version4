import { describe, expect, it, vi } from "vitest";
import {
  buildDescription,
  buildRedirectUrl,
  checkStatus,
  decidePayment,
  ENABLED_CURRENCIES,
  formatAmount,
  initPayment,
  redactUrl,
  type EasyPayConfig,
} from "./easypay";

const config: EasyPayConfig = { baseUrl: "https://pay.example", mode: "v1", cid: "CID123", token: "SECRET-TOKEN" };
const order = { paymentOrderRef: "HBABCDEFGHIJKL", providerReference: "REF-1", total: 1, currency: "USD" as const };

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const initInput = {
  orderRef: "HBABCDEFGHIJKL",
  amount: 1,
  currency: "USD" as const,
  description: "HolisticBooks – Titre (Livre numérique)",
  successUrl: "https://site/payment/return?o=HBABCDEFGHIJKL&etat=succes",
  errorUrl: "https://site/payment/return?o=HBABCDEFGHIJKL&etat=erreur",
  cancelUrl: "https://site/payment/return?o=HBABCDEFGHIJKL&etat=annule",
  customerName: "Awa Kabila",
  customerEmail: "awa@example.com",
};

function check(overrides: Record<string, unknown> = {}, payment: Record<string, unknown> = {}) {
  return jsonResponse({
    transaction: { order_ref: "HBABCDEFGHIJKL", reference: "REF-1", amount: 1, currency: "USD", ...overrides },
    payment: { status: "SUCCESS", channel: "MOBILE MONEY", reference: "PAY-9", ...payment },
  });
}

describe("EasyPay — initialisation", () => {
  it("code 1 : renvoie la référence et appelle l'URL documentée avec cid et token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ code: 1, reference: "REF-1" }));
    const result = await initPayment(config, initInput, fetchMock);
    expect(result).toMatchObject({ ok: true, reference: "REF-1" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://pay.example/v1/payment/initialization?cid=CID123&token=SECRET-TOKEN");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ order_ref: "HBABCDEFGHIJKL", amount: 1, currency: "USD", language: "FR", customer_name: "Awa Kabila" });
    expect(body.channels).toEqual([{ channel: "CREDIT CARD" }, { channel: "MOBILE MONEY" }]);
    // Le token n'est jamais dans le corps (seul élément journalisé avec l'URL masquée).
    expect(JSON.stringify(result.request)).not.toContain("SECRET-TOKEN");
  });

  it("code différent de 1 : échec avec le message EasyPay", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ code: 0, message: "Montant invalide" }));
    const result = await initPayment(config, initInput, fetchMock);
    expect(result).toMatchObject({ ok: false, message: "Montant invalide" });
  });

  it("refuse un order_ref hors format (ex. UUID de 36 caractères)", async () => {
    await expect(initPayment(config, { ...initInput, orderRef: "0b2d1066-ad2e-4eb2-ae2e-efa9ee9da1a9" }, vi.fn())).rejects.toThrow("order_ref");
  });

  it("passerelle injoignable : échec propre", async () => {
    const result = await initPayment(config, initInput, vi.fn().mockRejectedValue(new Error("ECONNRESET")));
    expect(result).toMatchObject({ ok: false, httpStatus: null });
  });
});

describe("EasyPay — utilitaires", () => {
  it("URL de redirection et URL masquée", () => {
    expect(buildRedirectUrl(config, "REF 1")).toBe("https://pay.example/v1/payment/initialization?reference=REF%201");
    const redacted = redactUrl("https://pay.example/v1/payment/initialization?cid=CID123&token=SECRET-TOKEN");
    expect(redacted).not.toContain("SECRET-TOKEN");
    expect(redacted).not.toContain("CID123");
  });

  it("montants : 2 décimales en USD, entiers en CDF ; CDF fermé au lancement", () => {
    expect(formatAmount(1.005, "USD")).toBe(1);
    expect(formatAmount(4.999, "USD")).toBe(5);
    expect(formatAmount(2500.4, "CDF")).toBe(2500);
    expect(() => formatAmount(0, "USD")).toThrow();
    expect(ENABLED_CURRENCIES).toEqual(["USD"]);
  });

  it("description : « HolisticBooks – Titre (format) » sans caractères spéciaux", () => {
    expect(buildDescription("Dieu & l'argent #1", "Livre numérique")).toBe("HolisticBooks – Dieu l'argent 1 (Livre numérique)");
  });
});

describe("EasyPay — checking-status et décision", () => {
  it("appelle checking-status en GET sans identifiants", async () => {
    const fetchMock = vi.fn().mockResolvedValue(check());
    await checkStatus(config, "REF-1", fetchMock);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://pay.example/v1/payment/REF-1/checking-status");
    expect(init.method).toBe("GET");
    expect(url).not.toContain("token");
  });

  it("SUCCESS concordant → paid", async () => {
    expect(decidePayment(order, await checkStatus(config, "REF-1", vi.fn().mockResolvedValue(check())))).toMatchObject({ outcome: "paid" });
  });

  it("PENDING → pending", async () => {
    const result = await checkStatus(config, "REF-1", vi.fn().mockResolvedValue(check({}, { status: "PENDING" })));
    expect(decidePayment(order, result).outcome).toBe("pending");
  });

  it("FAILED → failed", async () => {
    const result = await checkStatus(config, "REF-1", vi.fn().mockResolvedValue(check({}, { status: "FAILED" })));
    expect(decidePayment(order, result).outcome).toBe("failed");
  });

  it("CANCELED → failed (annulé)", async () => {
    const result = await checkStatus(config, "REF-1", vi.fn().mockResolvedValue(check({}, { status: "CANCELED" })));
    expect(decidePayment(order, result)).toMatchObject({ outcome: "failed", reason: "paiement annulé" });
  });

  it("SUCCESS avec montant différent → needs_review", async () => {
    const result = await checkStatus(config, "REF-1", vi.fn().mockResolvedValue(check({ amount: 0.5 })));
    expect(decidePayment(order, result).outcome).toBe("needs_review");
  });

  it("SUCCESS sans montant → needs_review (jamais de validation automatique)", async () => {
    const result = await checkStatus(config, "REF-1", vi.fn().mockResolvedValue(check({ amount: undefined }, { amount: undefined })));
    expect(decidePayment(order, result)).toMatchObject({ outcome: "needs_review", reason: "montant non renvoyé par EasyPay" });
  });

  it("SUCCESS dans une autre devise → needs_review", async () => {
    const result = await checkStatus(config, "REF-1", vi.fn().mockResolvedValue(check({ currency: "CDF" })));
    expect(decidePayment(order, result).outcome).toBe("needs_review");
  });

  it("SUCCESS pour un autre order_ref → needs_review", async () => {
    const result = await checkStatus(config, "REF-1", vi.fn().mockResolvedValue(check({ order_ref: "HBZZZZZZZZZZZZ" })));
    expect(decidePayment(order, result).outcome).toBe("needs_review");
  });

  it("SUCCESS pour une autre référence de transaction → needs_review", async () => {
    const result = await checkStatus(config, "REF-1", vi.fn().mockResolvedValue(check({ reference: "REF-AUTRE" })));
    expect(decidePayment(order, result).outcome).toBe("needs_review");
  });

  it("HTTP en erreur → pending (on revérifiera)", async () => {
    const result = await checkStatus(config, "REF-1", vi.fn().mockResolvedValue(jsonResponse({ message: "x" }, 500)));
    expect(decidePayment(order, result).outcome).toBe("pending");
  });
});
