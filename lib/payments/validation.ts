export const CINETPAY_CHANNELS = ["ALL", "MOBILE_MONEY", "CREDIT_CARD", "WALLET"] as const;

export type CinetPayChannel = (typeof CINETPAY_CHANNELS)[number];

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
  channels: CinetPayChannel;
  currency: "USD";
  customer: ValidatedCheckoutCustomer;
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
    throw new Error("HolistiqueBooks Checkout avec CinetPay est actuellement disponible uniquement en USD.");
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
    throw new Error("Nom, prenom, email et telephone sont requis pour initialiser un paiement CinetPay.");
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
      "Le canal carte bancaire CinetPay exige customer_address, customer_city, customer_country et customer_zip_code.",
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

  if (!bookId && !orderId) {
    throw new Error("Un bookId ou un orderId est requis pour lancer le paiement.");
  }

  if (bookId && orderId) {
    throw new Error("Envoyez soit un bookId, soit un orderId, mais pas les deux.");
  }

  if (!isCinetPayChannel(input.channels)) {
    throw new Error("channels doit etre ALL, MOBILE_MONEY, CREDIT_CARD ou WALLET.");
  }

  const customer = validateCheckoutCustomer(normalizeCheckoutCustomer(input.customer), input.channels);

  return {
    bookId,
    orderId,
    channels: input.channels,
    currency: validateUsdCurrency(input.currency),
    customer,
  };
}
