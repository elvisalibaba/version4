import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/service";
import type { Database, OrderPaymentStatus } from "@/types/database";
import type { CheckoutBookFormat, CinetPayChannel, ValidatedCheckoutCustomer } from "./validation";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];
type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];
type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];
type OrderItemInsert = Database["public"]["Tables"]["order_items"]["Insert"];
type BookTitleRow = Pick<Database["public"]["Tables"]["books"]["Row"], "id" | "title">;

type CheckoutBookRow = Pick<
  Database["public"]["Tables"]["books"]["Row"],
  "id" | "title" | "status" | "price" | "currency_code" | "is_single_sale_enabled"
> & {
  book_formats:
    | Array<{
        format: Database["public"]["Tables"]["book_formats"]["Row"]["format"];
        price: number;
        currency_code: string;
        is_published: boolean;
      }>
    | null;
};

type CheckoutBookFormatRow = NonNullable<CheckoutBookRow["book_formats"]>[number];

type CheckoutBookContext = {
  id: string;
  title: string;
  amount: number;
  currencyCode: string;
  format: CheckoutBookFormat;
};

type InitProviderPayload = {
  orderId: string;
  amount: number;
  description: string;
  channel: CinetPayChannel;
  customer: ValidatedCheckoutCustomer;
  returnUrl: string;
};

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

type VerificationOutcome = {
  orderStatus: OrderPaymentStatus;
  providerStatus: string;
  providerCode: string | null;
  providerMessage: string | null;
  providerData: Record<string, unknown>;
};

type PreparedOrder = {
  order: OrderRow;
  items: OrderItemRow[];
  bookTitles: string[];
};

type EasyPayConfig = {
  baseUrl: string;
  mode: "sandbox" | "v1";
  correlationId: string;
  publishableKey: string;
};

const CHECKOUT_FORMAT_PRIORITY: CheckoutBookFormat[] = ["ebook", "paperback", "hardcover"];

export class PaymentFlowError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "PaymentFlowError";
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
    throw new PaymentFlowError("La configuration EasyPay est incomplete cote serveur.", 500);
  }

  if (modeRaw !== "sandbox" && modeRaw !== "v1") {
    throw new PaymentFlowError("EASYPAY_MODE doit etre 'sandbox' ou 'v1'.", 500);
  }

  return {
    baseUrl,
    mode: modeRaw,
    correlationId,
    publishableKey,
  };
}

function createPaymentServiceClient() {
  return createServiceRoleClient();
}

function resolveAppBaseUrl(fallbackOrigin?: string) {
  const configured = process.env.APP_BASE_URL?.replace(/\/$/, "");

  if (configured) {
    return configured;
  }

  if (fallbackOrigin) {
    return fallbackOrigin.replace(/\/$/, "");
  }

  throw new PaymentFlowError("APP_BASE_URL est requis pour construire les URLs EasyPay.", 500);
}

function buildAppUrl(baseUrl: string, path: string) {
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function buildEasyPayModeUrl(config: EasyPayConfig, path: string) {
  return `${config.baseUrl}/${config.mode}/${path.replace(/^\//, "")}`;
}

function createTransactionId(orderId: string) {
  const compactOrderId = orderId.replace(/-/g, "").slice(0, 12).toUpperCase();
  return `HB-${compactOrderId}-${Date.now()}`;
}

function toProviderAmount(amount: number) {
  const normalizedAmount = Number(amount.toFixed(2));

  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new PaymentFlowError("Montant de commande invalide pour EasyPay.", 400);
  }

  return normalizedAmount;
}

function mergePaymentMetadata(
  currentValue: Record<string, unknown> | null | undefined,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...(currentValue ?? {}),
    ...patch,
  };
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
    throw new PaymentFlowError("La passerelle EasyPay est temporairement indisponible.", 502);
  }

  return data;
}

async function loadCheckoutBookContext(userId: string, bookId: string, requestedFormat?: CheckoutBookFormat): Promise<CheckoutBookContext> {
  const service = createPaymentServiceClient();
  const [bookResult, libraryResult] = await Promise.all([
    service
      .from("books")
      .select("id, title, status, price, currency_code, is_single_sale_enabled, book_formats!left(format, price, currency_code, is_published)")
      .filter("id", "eq", bookId)
      .maybeSingle(),
    service
      .from("library")
      .select("id, access_type")
      .filter("user_id", "eq", userId)
      .filter("book_id", "eq", bookId)
      .maybeSingle(),
  ]);

  const book = (bookResult.data ?? null) as CheckoutBookRow | null;
  const existingLibraryEntry =
    (libraryResult.data ?? null) as { id: string; access_type: Database["public"]["Tables"]["library"]["Row"]["access_type"] } | null;

  if (!book || book.status !== "published") {
    throw new PaymentFlowError("Ce livre n est pas disponible a la vente.", 404);
  }

  if (!book.is_single_sale_enabled) {
    throw new PaymentFlowError("La vente unitaire n est pas activee pour ce livre.", 409);
  }

  const publishedFormats = (book.book_formats ?? []).filter(
    (format): format is CheckoutBookFormatRow =>
      format.is_published && CHECKOUT_FORMAT_PRIORITY.includes(format.format as CheckoutBookFormat),
  );

  const selectedFormat =
    requestedFormat
      ? publishedFormats.find((format) => format.format === requestedFormat)
      : CHECKOUT_FORMAT_PRIORITY.map((formatKey) => publishedFormats.find((format) => format.format === formatKey)).find(Boolean) ?? null;

  if (requestedFormat && !selectedFormat) {
    throw new PaymentFlowError("Le format selectionne n est pas disponible pour ce livre.", 409);
  }

  const effectiveFormat = (selectedFormat?.format ?? "ebook") as CheckoutBookFormat;

  if (existingLibraryEntry?.access_type === "purchase" && effectiveFormat === "ebook") {
    throw new PaymentFlowError("Ce livre a deja ete achete sur votre compte.", 409);
  }

  const amount = selectedFormat?.price ?? book.price;
  const currencyCode = selectedFormat?.currency_code ?? book.currency_code;

  if (currencyCode !== "USD") {
    throw new PaymentFlowError(
      "Le checkout EasyPay de HolistiqueBooks est actuellement configure en USD. Le livre selectionne doit donc etre facture en USD.",
      409,
    );
  }

  return {
    id: book.id,
    title: book.title,
    amount,
    currencyCode,
    format: effectiveFormat,
  };
}

async function loadPreparedOrderForUser(userId: string, orderId: string): Promise<PreparedOrder> {
  const service = createPaymentServiceClient();
  const { data: orderData } = await service
    .from("orders")
    .select("*")
    .filter("id", "eq", orderId)
    .maybeSingle();

  const order = (orderData ?? null) as OrderRow | null;

  if (!order || order.user_id !== userId) {
    throw new PaymentFlowError("Commande introuvable pour cet utilisateur.", 404);
  }

  if (order.payment_status === "paid") {
    throw new PaymentFlowError("Cette commande est deja payee.", 409);
  }

  const { data: itemData } = await service
    .from("order_items")
    .select("*")
    .filter("order_id", "eq", order.id);
  const items = (itemData ?? []) as OrderItemRow[];

  if (items.length === 0) {
    throw new PaymentFlowError("Cette commande ne contient aucun livre a payer.", 409);
  }

  if (order.currency_code !== "USD" || items.some((item) => item.currency_code !== "USD")) {
    throw new PaymentFlowError("EasyPay checkout est actuellement limite aux commandes USD.", 409);
  }

  const bookIds = Array.from(new Set(items.map((item) => item.book_id)));
  const { data: bookData } = await service
    .from("books")
    .select("id, title")
    .filter("id", "in", toPostgrestInFilter(bookIds));
  const titleMap = new Map(((bookData ?? []) as BookTitleRow[]).map((book) => [book.id, book.title]));

  return {
    order,
    items,
    bookTitles: items.map((item) => titleMap.get(item.book_id) ?? "Livre HolistiqueBooks"),
  };
}

async function createPendingOrderForBook(params: {
  userId: string;
  bookId: string;
  bookFormat?: CheckoutBookFormat;
  channel: CinetPayChannel;
}): Promise<PreparedOrder> {
  const service = createPaymentServiceClient();
  const checkoutBook = await loadCheckoutBookContext(params.userId, params.bookId, params.bookFormat);
  const orderId = crypto.randomUUID();
  const transactionId = createTransactionId(orderId);

  const orderInsert = {
    id: orderId,
    user_id: params.userId,
    total_price: checkoutBook.amount,
    currency_code: "USD",
    payment_status: "pending",
    payment_provider: "easypay",
    payment_transaction_id: transactionId,
    payment_channel: params.channel,
    payment_provider_status: "INIT_PREPARED",
    payment_metadata: {
      order_source: "single_book_checkout",
      requested_channel: params.channel,
      book_ids: [checkoutBook.id],
      selected_format: checkoutBook.format,
    },
  } satisfies OrderInsert;

  const { data: orderData, error: orderError } = await service.from("orders").insert(orderInsert).select("*").maybeSingle();
  const createdOrder = (orderData ?? null) as OrderRow | null;

  if (orderError || !createdOrder) {
    throw new PaymentFlowError("Impossible de creer la commande locale avant le checkout.", 500);
  }

  const itemInsert = {
    order_id: orderId,
    book_id: checkoutBook.id,
    price: checkoutBook.amount,
    currency_code: "USD",
    book_format: checkoutBook.format,
  } satisfies OrderItemInsert;

  const { data: itemData, error: itemError } = await service.from("order_items").insert(itemInsert).select("*");

  if (itemError || !(itemData ?? []).length) {
    await service
      .from("orders")
      .update({
        payment_status: "failed",
        payment_provider_status: "INIT_LOCAL_ITEM_FAILED",
        payment_metadata: mergePaymentMetadata(createdOrder.payment_metadata, {
          init_error: "order_items_insert_failed",
        }),
      })
      .filter("id", "eq", orderId);

    throw new PaymentFlowError("La commande n a pas pu etre preparee completement.", 500);
  }

  return {
    order: createdOrder,
    items: itemData as OrderItemRow[],
    bookTitles: [checkoutBook.title],
  };
}

async function refreshOrderInitState(
  order: OrderRow,
  patch: Record<string, unknown>,
  providerStatus: string,
  paymentStatus?: OrderPaymentStatus,
  providerReference?: string,
) {
  const service = createPaymentServiceClient();
  const update: OrderUpdate = {
    payment_provider: "easypay",
    payment_provider_status: providerStatus,
    payment_metadata: mergePaymentMetadata(order.payment_metadata, patch),
  };

  if (paymentStatus) {
    update.payment_status = paymentStatus;
  }

  if (providerReference) {
    update.payment_transaction_id = providerReference;
  }

  await service.from("orders").update(update).filter("id", "eq", order.id);
}

function buildCheckoutDescription(bookTitles: string[]) {
  const sanitizedTitles = bookTitles
    .map((title) => title.replace(/[#$\/_&]/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (bookTitles.length === 1) {
    return `Achat livre HolistiqueBooks - ${sanitizedTitles[0] ?? "Livre"}`;
  }

  return `Achat HolistiqueBooks - ${sanitizedTitles.length || bookTitles.length} livres`;
}

function toPostgrestInFilter(values: string[]) {
  return `(${values.map((value) => `"${value.replace(/"/g, '\\"')}"`).join(",")})`;
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
  return fullName || customer.email || "Client HolistiqueBooks";
}

async function initializeProviderCheckout(payload: InitProviderPayload) {
  const config = getEasyPayConfig();
  const initUrl = `${buildEasyPayModeUrl(config, "/payment/initialization")}?cid=${encodeURIComponent(config.correlationId)}&token=${encodeURIComponent(config.publishableKey)}`;

  const requestBody: Record<string, unknown> = {
    order_ref: payload.orderId,
    currency: "USD",
    amount: toProviderAmount(payload.amount),
    description: payload.description,
    success_url: payload.returnUrl,
    cancel_url: payload.returnUrl,
    error_url: payload.returnUrl,
    language: "FR",
    channels: mapEasyPayChannels(payload.channel),
    customer_name: buildCustomerFullName(payload.customer),
  };

  if (payload.customer.email) {
    requestBody.customer_email = payload.customer.email;
  }

  const result = await fetchJson<EasyPayInitResponse>(initUrl, requestBody);
  const responseCode = result?.code !== undefined && result?.code !== null ? String(result.code) : null;
  const responseMessage = cleanString(result?.message);
  const providerReference = cleanString(result?.reference);

  if (responseCode !== "1" || !providerReference) {
    throw new PaymentFlowError(responseMessage ?? "EasyPay n a pas pu initialiser la transaction.", 502);
  }

  const paymentUrl = `${buildEasyPayModeUrl(config, "/payment/initialization")}?reference=${encodeURIComponent(providerReference)}`;

  return {
    paymentUrl,
    providerReference,
    responseCode,
    responseMessage,
  };
}

export async function initCinetPayCheckout(params: {
  userId: string;
  bookId?: string;
  orderId?: string;
  bookFormat?: CheckoutBookFormat;
  channel: CinetPayChannel;
  customer: ValidatedCheckoutCustomer;
  appBaseUrl?: string;
}) {
  const baseUrl = resolveAppBaseUrl(params.appBaseUrl);
  const preparedOrder = params.bookId
    ? await createPendingOrderForBook({
        userId: params.userId,
        bookId: params.bookId,
        bookFormat: params.bookFormat,
        channel: params.channel,
      })
    : await loadPreparedOrderForUser(params.userId, params.orderId!);

  const provisionalReference =
    preparedOrder.order.payment_transaction_id && preparedOrder.order.payment_transaction_id.trim().length > 0
      ? preparedOrder.order.payment_transaction_id
      : createTransactionId(preparedOrder.order.id);

  const service = createPaymentServiceClient();
  const metadataPatch = mergePaymentMetadata(preparedOrder.order.payment_metadata, {
    requested_channel: params.channel,
    ...(params.bookFormat ? { requested_format: params.bookFormat } : {}),
  });

  const { data: updatedOrder } = await service
    .from("orders")
    .update({
      payment_status: "pending",
      payment_provider: "easypay",
      payment_transaction_id: provisionalReference,
      payment_channel: params.channel,
      payment_provider_status: "INIT_PREPARED",
      payment_metadata: metadataPatch,
    })
    .filter("id", "eq", preparedOrder.order.id)
    .select("*")
    .maybeSingle();

  if (updatedOrder) {
    preparedOrder.order = updatedOrder;
  }

  try {
    const providerResponse = await initializeProviderCheckout({
      orderId: preparedOrder.order.id,
      amount: preparedOrder.order.total_price,
      description: buildCheckoutDescription(preparedOrder.bookTitles),
      channel: params.channel,
      customer: params.customer,
      returnUrl: buildAppUrl(baseUrl, `/payment/return?orderId=${preparedOrder.order.id}`),
    });

    await refreshOrderInitState(
      preparedOrder.order,
      {
        init_response_code: providerResponse.responseCode,
        init_response_message: providerResponse.responseMessage,
        provider_reference: providerResponse.providerReference,
      },
      "INITIATED",
      "pending",
      providerResponse.providerReference,
    );

    return {
      orderId: preparedOrder.order.id,
      transactionId: providerResponse.providerReference,
      paymentUrl: providerResponse.paymentUrl,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "EasyPay initialization failed.";

    await refreshOrderInitState(
      preparedOrder.order,
      {
        init_error: message,
      },
      "INIT_FAILED",
      "failed",
    );

    if (error instanceof PaymentFlowError) {
      throw error;
    }

    throw new PaymentFlowError("Impossible d initialiser le checkout EasyPay.", 502);
  }
}

async function verifyProviderTransaction(transactionId: string) {
  const config = getEasyPayConfig();
  const checkUrl = buildEasyPayModeUrl(config, `/payment/${encodeURIComponent(transactionId)}/checking-payment`);
  const result = await fetchJson<EasyPayCheckingResponse>(checkUrl, {});

  const providerStatus = (cleanString(result?.payment?.status) ?? "UNKNOWN").toUpperCase();
  const providerMessage = cleanString(result?.message);

  let orderStatus: OrderPaymentStatus = "pending";
  if (providerStatus === "SUCCESS") {
    orderStatus = "paid";
  } else if (providerStatus === "CANCELED" || providerStatus === "DECLINED" || providerStatus === "FAILED") {
    orderStatus = "failed";
  }

  return {
    orderStatus,
    providerStatus,
    providerCode: null,
    providerMessage,
    providerData: {
      transaction_reference: cleanString(result?.transaction?.reference) ?? transactionId,
      order_ref: cleanString(result?.transaction?.order_ref),
      channel: cleanString(result?.payment?.channel),
      payment_status: providerStatus,
    },
  } satisfies VerificationOutcome;
}

async function loadOrderByTransactionId(transactionId: string) {
  const service = createPaymentServiceClient();
  const { data: orderData } = await service
    .from("orders")
    .select("*")
    .filter("payment_transaction_id", "eq", transactionId)
    .maybeSingle();

  const order = (orderData ?? null) as OrderRow | null;
  if (!order || (order.payment_provider !== "easypay" && order.payment_provider !== "cinetpay")) {
    throw new PaymentFlowError("Aucune commande locale ne correspond a cette transaction EasyPay.", 404);
  }

  const { data: itemData } = await service
    .from("order_items")
    .select("*")
    .filter("order_id", "eq", order.id);

  return {
    order,
    items: (itemData ?? []) as OrderItemRow[],
  };
}

async function persistVerifiedOrderState(params: {
  order: OrderRow;
  items: OrderItemRow[];
  verification: VerificationOutcome;
}) {
  const service = createPaymentServiceClient();
  const metadataPatch = mergePaymentMetadata(params.order.payment_metadata, {
    last_verification_at: new Date().toISOString(),
    last_verification_code: params.verification.providerCode,
    last_verification_message: params.verification.providerMessage,
    last_verification_data: params.verification.providerData,
  });

  const updatePayload: OrderUpdate = {
    payment_provider: "easypay",
    payment_provider_status: params.verification.providerStatus,
    payment_verified_at: new Date().toISOString(),
    payment_metadata: metadataPatch,
  };

  if (params.verification.orderStatus === "paid") {
    updatePayload.payment_status = "paid";
  } else if (params.verification.orderStatus === "failed" && params.order.payment_status !== "paid") {
    updatePayload.payment_status = "failed";
  } else if (params.order.payment_status !== "paid") {
    updatePayload.payment_status = "pending";
  }

  await service.from("orders").update(updatePayload).filter("id", "eq", params.order.id);

  if (params.verification.orderStatus !== "paid") {
    return {
      orderId: params.order.id,
      paymentStatus: updatePayload.payment_status ?? params.order.payment_status,
      providerStatus: params.verification.providerStatus,
      transactionId: params.order.payment_transaction_id,
    };
  }

  for (const item of params.items) {
    if ((item.book_format ?? "ebook") !== "ebook") {
      continue;
    }

    await service.from("library").upsert(
      {
        user_id: params.order.user_id,
        book_id: item.book_id,
        access_type: "purchase",
        purchased_at: new Date().toISOString(),
        subscription_id: null,
      },
      { onConflict: "user_id,book_id" },
    );
  }

  return {
    orderId: params.order.id,
    paymentStatus: "paid" as OrderPaymentStatus,
    providerStatus: params.verification.providerStatus,
    transactionId: params.order.payment_transaction_id,
  };
}

export async function reconcileCinetPayTransaction(transactionId: string) {
  const prepared = await loadOrderByTransactionId(transactionId);
  const verification = await verifyProviderTransaction(transactionId);
  return persistVerifiedOrderState({
    order: prepared.order,
    items: prepared.items,
    verification,
  });
}

export async function reconcileCinetPayOrder(orderId: string) {
  const service = createPaymentServiceClient();
  const { data: orderData } = await service
    .from("orders")
    .select("*")
    .filter("id", "eq", orderId)
    .maybeSingle();
  const order = (orderData ?? null) as OrderRow | null;

  if (!order || (order.payment_provider !== "easypay" && order.payment_provider !== "cinetpay") || !order.payment_transaction_id) {
    throw new PaymentFlowError("Cette commande n est pas liee a une transaction EasyPay exploitable.", 404);
  }

  return reconcileCinetPayTransaction(order.payment_transaction_id);
}

export function getTransactionIdFromNotifyPayload(payload: unknown) {
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
