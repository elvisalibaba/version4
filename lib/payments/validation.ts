import { CHECKOUT_BOOK_FORMATS } from "@/lib/book-formats";

export const CINETPAY_CHANNELS = ["ALL", "MOBILE_MONEY", "CREDIT_CARD"] as const;

export type CinetPayChannel = (typeof CINETPAY_CHANNELS)[number];
export type CheckoutBookFormat = (typeof CHECKOUT_BOOK_FORMATS)[number];

export type CheckoutCustomerInput = {
  customerId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  state?: string | null;
  zipCode?: string | null;
};

export type ValidatedCheckoutCustomer = {
  customerId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string | null;
  city: string | null;
  country: string | null;
  state: string | null;
  zipCode: string | null;
};

export type CinetPayInitPayload = {
  bookId?: string;
  orderId?: string;
  bookFormat?: CheckoutBookFormat;
  channels: CinetPayChannel;
  currency: "USD";
  customer: ValidatedCheckoutCustomer;
};

export type CinetPayDonationInitPayload = {
  amount: number;
  channels: CinetPayChannel;
  currency: "USD";
  customer: ValidatedCheckoutCustomer;
  donorReference?: string;
  note?: string;
};

const COUNTRY_ALIASES: Record<string, string> = {
  benin: "BJ",
  bf: "BF",
  bj: "BJ",
  burkinafaso: "BF",
  ca: "CA",
  cameroon: "CM",
  cameroun: "CM",
  canada: "CA",
  cd: "CD",
  cg: "CG",
  ci: "CI",
  cm: "CM",
  congo: "CG",
  congobrazzaville: "CG",
  congodemocratique: "CD",
  congokinshasa: "CD",
  cotedivoire: "CI",
  drc: "CD",
  etatsunis: "US",
  fr: "FR",
  france: "FR",
  ga: "GA",
  gabon: "GA",
  gn: "GN",
  guinee: "GN",
  ivorycoast: "CI",
  mali: "ML",
  ml: "ML",
  rdcongo: "CD",
  rdc: "CD",
  republiqueducongo: "CG",
  republiquedemocratiqueducongo: "CD",
  senegal: "SN",
  sn: "SN",
  tg: "TG",
  togo: "TG",
  us: "US",
  usa: "US",
  unitedstates: "US",
};

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isCinetPayChannel(value: unknown): value is CinetPayChannel {
  return typeof value === "string" && CINETPAY_CHANNELS.includes(value as CinetPayChannel);
}

export function channelRequiresCardCustomerFields(channel: CinetPayChannel) {
  return channel === "CREDIT_CARD" || channel === "ALL";
}

export function validateUsdCurrency(value: unknown): "USD" {
  const currency = cleanString(value) ?? "USD";

  if (currency !== "USD") {
    throw new Error("HolistiqueBooks Checkout avec EasyPay est actuellement disponible uniquement en USD.");
  }

  return "USD";
}

function normalizeLettersToken(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toLowerCase();
}

function normalizeCountryCode(value: string | null) {
  if (!value) {
    return null;
  }

  const token = normalizeLettersToken(value);

  if (token.length === 2) {
    return token.toUpperCase();
  }

  return COUNTRY_ALIASES[token] ?? value.trim().toUpperCase();
}

function normalizeStateCode(value: string | null, country: string | null) {
  const token = value ? normalizeLettersToken(value) : "";

  if (token.length === 2) {
    return token.toUpperCase();
  }

  if (country && country !== "US" && country !== "CA") {
    return country;
  }

  return cleanString(value)?.toUpperCase() ?? null;
}

function normalizePhoneNumber(value: string | null) {
  if (!value) {
    return "";
  }

  const compact = value.replace(/[^\d+]/g, "");
  if (compact.startsWith("00")) {
    return `+${compact.slice(2)}`;
  }

  return compact;
}

function normalizeZipCode(value: string | null) {
  return value?.trim().replace(/\s+/g, "") ?? null;
}

function normalizeAmount(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value.trim().replace(",", "."));
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  throw new Error("Montant de don invalide.");
}

export function normalizeCheckoutCustomer(input: unknown): ValidatedCheckoutCustomer {
  const customer = isRecord(input) ? input : {};
  const country = normalizeCountryCode(cleanString(customer.country));

  return {
    customerId: cleanString(customer.customerId),
    firstName: cleanString(customer.firstName) ?? "",
    lastName: cleanString(customer.lastName) ?? "",
    email: cleanString(customer.email) ?? "",
    phoneNumber: normalizePhoneNumber(cleanString(customer.phoneNumber)),
    address: cleanString(customer.address),
    city: cleanString(customer.city),
    country,
    state: normalizeStateCode(cleanString(customer.state), country),
    zipCode: normalizeZipCode(cleanString(customer.zipCode)),
  };
}

export function validateCheckoutCustomer(customer: ValidatedCheckoutCustomer, channels: CinetPayChannel) {
  const missingBaseFields = [
    ["firstName", customer.firstName],
    ["lastName", customer.lastName],
    ["email", customer.email],
    ["phoneNumber", customer.phoneNumber],
  ].filter(([, value]) => !value);

  if (missingBaseFields.length > 0) {
    throw new Error("Nom, prenom, email et telephone sont requis pour initialiser un paiement EasyPay.");
  }

  if (!channelRequiresCardCustomerFields(channels)) {
    return customer;
  }

  const missingCardFields = [
    ["address", customer.address],
    ["city", customer.city],
    ["country", customer.country],
    ["zipCode", customer.zipCode],
  ].filter(([, value]) => !value);

  if (missingCardFields.length > 0) {
    throw new Error(
      "Le canal carte bancaire EasyPay exige customer_address, customer_city, customer_country et customer_zip_code.",
    );
  }

  if (!/^[A-Z]{2}$/.test(customer.country ?? "")) {
    throw new Error("Pour la carte bancaire, le pays doit etre un code ISO sur 2 lettres, par exemple CI, CD, CM, US ou FR.");
  }

  if ((customer.country === "US" || customer.country === "CA") && !/^[A-Z]{2}$/.test(customer.state ?? "")) {
    throw new Error("Pour la carte bancaire avec un pays US ou CA, renseignez un code etat ou province sur 2 lettres.");
  }

  return {
    ...customer,
    state: customer.state ?? customer.country,
  };
}

export function validateCinetPayInitPayload(input: unknown): CinetPayInitPayload {
  if (!isRecord(input)) {
    throw new Error("Payload de paiement invalide.");
  }

  const bookId = cleanString(input.bookId) ?? undefined;
  const orderId = cleanString(input.orderId) ?? undefined;
  const rawBookFormat = cleanString(input.bookFormat);
  const bookFormat =
    rawBookFormat && CHECKOUT_BOOK_FORMATS.includes(rawBookFormat as CheckoutBookFormat)
      ? (rawBookFormat as CheckoutBookFormat)
      : undefined;

  if (!bookId && !orderId) {
    throw new Error("Un bookId ou un orderId est requis pour lancer le paiement.");
  }

  if (bookId && orderId) {
    throw new Error("Envoyez soit un bookId, soit un orderId, mais pas les deux.");
  }

  if (rawBookFormat && !bookFormat) {
    throw new Error("bookFormat doit etre holistique_store, ebook, paperback, pocket ou hardcover.");
  }

  if (orderId && bookFormat) {
    throw new Error("bookFormat est autorise uniquement avec bookId.");
  }

  if (!isCinetPayChannel(input.channels)) {
    throw new Error("channels doit etre ALL, MOBILE_MONEY ou CREDIT_CARD.");
  }

  const customer = validateCheckoutCustomer(normalizeCheckoutCustomer(input.customer), input.channels);

  return {
    bookId,
    orderId,
    bookFormat,
    channels: input.channels,
    currency: validateUsdCurrency(input.currency),
    customer,
  };
}

export function validateCinetPayDonationInitPayload(input: unknown): CinetPayDonationInitPayload {
  if (!isRecord(input)) {
    throw new Error("Payload de don invalide.");
  }

  const amount = Number(normalizeAmount(input.amount).toFixed(2));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Le montant du don doit etre superieur a zero.");
  }

  if (amount < 1) {
    throw new Error("Le montant minimum du don est de 1 USD.");
  }

  if (amount > 50000) {
    throw new Error("Le montant du don depasse la limite autorisee.");
  }

  if (!isCinetPayChannel(input.channels)) {
    throw new Error("channels doit etre ALL, MOBILE_MONEY ou CREDIT_CARD.");
  }

  const customer = validateCheckoutCustomer(normalizeCheckoutCustomer(input.customer), input.channels);
  const donorReference = cleanString(input.donorReference) ?? undefined;
  const note = cleanString(input.note) ?? undefined;

  if (donorReference && donorReference.length > 80) {
    throw new Error("La reference donateur est trop longue (80 caracteres max).");
  }

  if (note && note.length > 240) {
    throw new Error("Le message de don est trop long (240 caracteres max).");
  }

  return {
    amount,
    channels: input.channels,
    currency: validateUsdCurrency(input.currency),
    customer,
    donorReference,
    note,
  };
}
