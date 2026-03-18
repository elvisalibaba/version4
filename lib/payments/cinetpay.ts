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
  transactionId: string;
  amount: number;
  description: string;
  channel: CinetPayChannel;
  customer: ValidatedCheckoutCustomer;
  notifyUrl: string;
  returnUrl: string;
  metadata: string;
};

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

const CHECKOUT_FORMAT_PRIORITY: CheckoutBookFormat[] = ["ebook", "paperback", "hardcover"];

export class PaymentFlowError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "PaymentFlowError";
    this.status = status;
  }
}

function getCinetPayConfig() {
  const apiKey = process.env.CINETPAY_API_KEY;
  const siteId = process.env.CINETPAY_SITE_ID;
  const baseUrl = process.env.CINETPAY_BASE_URL?.replace(/\/$/, "") || "https://api-checkout.cinetpay.com/v2";

  if (!apiKey || !siteId) {
    throw new PaymentFlowError("La configuration CinetPay est incomplete cote serveur.", 500);
  }

  return {
    apiKey,
    siteId,
    baseUrl,
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

  throw new PaymentFlowError("APP_BASE_URL est requis pour construire les URLs CinetPay.", 500);
}

function buildAppUrl(baseUrl: string, path: string) {
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function createTransactionId(orderId: string) {
  const compactOrderId = orderId.replace(/-/g, "").slice(0, 12).toUpperCase();
  return `HB-${compactOrderId}-${Date.now()}`;
}

function toProviderAmount(amount: number) {
  const normalizedAmount = Number(amount.toFixed(2));

  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new PaymentFlowError("Montant de commande invalide pour CinetPay.", 400);
  }

  // La documentation CinetPay mentionne une contrainte multiple de 5 dans certains contextes,
  // mais montre aussi des exemples USD et ne confirme pas une regle universelle pour toutes les devises.
  // On n applique donc pas de validation agressive qui rejetterait injustement un prix USD comme 9.99.
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
    throw new PaymentFlowError("La passerelle CinetPay est temporairement indisponible.", 502);
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
      "Le checkout CinetPay de HolistiqueBooks est configure en USD. Le livre selectionne doit donc etre facture en USD.",
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
    throw new PaymentFlowError("CinetPay Checkout est actuellement limite aux commandes USD.", 409);
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
    payment_provider: "cinetpay",
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
) {
  const service = createPaymentServiceClient();
  const update: OrderUpdate = {
    payment_provider: "cinetpay",
    payment_provider_status: providerStatus,
    payment_metadata: mergePaymentMetadata(order.payment_metadata, patch),
  };

  if (paymentStatus) {
    update.payment_status = paymentStatus;
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

async function initializeProviderCheckout(payload: InitProviderPayload) {
  const config = getCinetPayConfig();
  const requestBody: Record<string, unknown> = {
    apikey: config.apiKey,
    site_id: config.siteId,
    transaction_id: payload.transactionId,
    amount: toProviderAmount(payload.amount),
    currency: "USD",
    description: payload.description,
    notify_url: payload.notifyUrl,
    return_url: payload.returnUrl,
    channels: payload.channel,
    lang: "fr",
    metadata: payload.metadata,
  };

  if (payload.customer.customerId) {
    requestBody.customer_id = payload.customer.customerId;
  }

  requestBody.customer_name = payload.customer.lastName;
  requestBody.customer_surname = payload.customer.firstName;
  requestBody.customer_phone_number = payload.customer.phoneNumber;
  requestBody.customer_email = payload.customer.email;

  if (payload.channel === "CREDIT_CARD" || payload.channel === "ALL") {
    requestBody.customer_address = payload.customer.address;
    requestBody.customer_city = payload.customer.city;
    requestBody.customer_country = payload.customer.country;
    requestBody.customer_state = payload.customer.state;
    requestBody.customer_zip_code = payload.customer.zipCode;
  }

  const result = await fetchJson<CinetPayInitResponse>(`${config.baseUrl}/payment`, requestBody);
  const paymentUrl = result?.data?.payment_url ?? null;
  const code = result?.code ?? null;
  const message = result?.message ?? null;
  const description = result?.description ?? null;

  if (!paymentUrl) {
    if (isUsdAccountCompatibilityError({ message: message ?? undefined, description: description ?? undefined })) {
      throw new PaymentFlowError(
        "Votre compte CinetPay ne semble pas autorise a encaisser en USD. Verifiez la compatibilite devise de votre compte avant la mise en production.",
        409,
      );
    }

    throw new PaymentFlowError(description ?? message ?? "CinetPay n a pas retourne de payment_url exploitable.", 502);
  }

  return {
    paymentUrl,
    responseCode: code,
    responseMessage: message,
    responseDescription: description,
    paymentToken: result?.data?.payment_token ?? null,
    paymentMethod: result?.data?.payment_method ?? result?.data?.payment_code ?? null,
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

  const transactionId =
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
      payment_provider: "cinetpay",
      payment_transaction_id: transactionId,
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
      transactionId,
      amount: preparedOrder.order.total_price,
      description: buildCheckoutDescription(preparedOrder.bookTitles),
      channel: params.channel,
      customer: params.customer,
      notifyUrl: buildAppUrl(baseUrl, "/api/payments/cinetpay/notify"),
      returnUrl: buildAppUrl(baseUrl, `/payment/return?orderId=${preparedOrder.order.id}`),
      metadata: JSON.stringify({
        orderId: preparedOrder.order.id,
        userId: params.userId,
      }),
    });

    await refreshOrderInitState(
      preparedOrder.order,
      {
        init_response_code: providerResponse.responseCode,
        init_response_message: providerResponse.responseMessage,
        init_response_description: providerResponse.responseDescription,
        payment_token: providerResponse.paymentToken,
        payment_method_hint: providerResponse.paymentMethod,
      },
      "INITIATED",
      "pending",
    );

    return {
      orderId: preparedOrder.order.id,
      transactionId,
      paymentUrl: providerResponse.paymentUrl,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "CinetPay initialization failed.";

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

    throw new PaymentFlowError("Impossible d initialiser le checkout CinetPay.", 502);
  }
}

async function verifyProviderTransaction(transactionId: string) {
  const config = getCinetPayConfig();
  const result = await fetchJson<CinetPayCheckResponse>(`${config.baseUrl}/payment/check`, {
    apikey: config.apiKey,
    site_id: config.siteId,
    transaction_id: transactionId,
  });

  const code = result?.code ?? null;
  const providerStatus = result?.data?.status ?? "UNKNOWN";
  const providerMessage = result?.description ?? result?.message ?? null;
  const normalizedStatus = providerStatus.toUpperCase();

  let orderStatus: OrderPaymentStatus = "pending";
  if (code === "00" || normalizedStatus === "ACCEPTED") {
    orderStatus = "paid";
  } else if (normalizedStatus === "REFUSED" || normalizedStatus === "FAILED" || normalizedStatus === "CANCELLED") {
    orderStatus = "failed";
  } else {
    orderStatus = "pending";
  }

  return {
    orderStatus,
    providerStatus,
    providerCode: code,
    providerMessage,
    providerData: {
      amount: result?.data?.amount ?? null,
      currency: result?.data?.currency ?? null,
      payment_method: result?.data?.payment_method ?? null,
      operator_id: result?.data?.operator_id ?? null,
      payment_date: result?.data?.payment_date ?? null,
      transaction_id: result?.data?.transaction_id ?? transactionId,
      metadata: result?.data?.metadata ?? null,
    },
  } satisfies VerificationOutcome;
}

async function loadOrderByTransactionId(transactionId: string) {
  const service = createPaymentServiceClient();
  const { data: orderData } = await service
    .from("orders")
    .select("*")
    .filter("payment_transaction_id", "eq", transactionId)
    .filter("payment_provider", "eq", "cinetpay")
    .maybeSingle();

  const order = (orderData ?? null) as OrderRow | null;
  if (!order) {
    throw new PaymentFlowError("Aucune commande locale ne correspond a cette transaction CinetPay.", 404);
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
        purchased_at:
          typeof params.verification.providerData.payment_date === "string" && params.verification.providerData.payment_date
            ? params.verification.providerData.payment_date
            : new Date().toISOString(),
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

  if (!order || order.payment_provider !== "cinetpay" || !order.payment_transaction_id) {
    throw new PaymentFlowError("Cette commande n est pas liee a une transaction CinetPay exploitable.", 404);
  }

  return reconcileCinetPayTransaction(order.payment_transaction_id);
}

export function getTransactionIdFromNotifyPayload(payload: Record<string, string>) {
  return payload.cpm_trans_id ?? payload.transaction_id ?? payload.trans_id ?? null;
}
