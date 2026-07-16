import type { BookFormatType } from "@/types/database";

export const BOOK_FORMATS = ["holistique_store", "ebook", "paperback", "pocket", "hardcover", "audiobook"] as const;
export const DIGITAL_BOOK_FORMATS = ["holistique_store", "ebook"] as const;
export const PHYSICAL_BOOK_FORMATS = ["paperback", "pocket", "hardcover"] as const;
export const CHECKOUT_BOOK_FORMATS = ["holistique_store", "ebook", "paperback", "pocket", "hardcover"] as const;

export type CheckoutBookFormat = (typeof CHECKOUT_BOOK_FORMATS)[number];

const FORMAT_ORDER = new Map<BookFormatType, number>(BOOK_FORMATS.map((format, index) => [format, index]));

export const BOOK_FORMAT_LABELS: Record<BookFormatType, string> = {
  holistique_store: "Holistique Store",
  ebook: "eBook",
  paperback: "Broche",
  pocket: "Poche",
  hardcover: "Relie",
  audiobook: "Audiobook",
};

export function getBookFormatLabel(format: BookFormatType) {
  return BOOK_FORMAT_LABELS[format] ?? format.replaceAll("_", " ");
}

export function isDigitalBookFormat(format: BookFormatType) {
  return DIGITAL_BOOK_FORMATS.includes(format as (typeof DIGITAL_BOOK_FORMATS)[number]);
}

export function isPhysicalBookFormat(format: BookFormatType) {
  return PHYSICAL_BOOK_FORMATS.includes(format as (typeof PHYSICAL_BOOK_FORMATS)[number]);
}

export function isCheckoutBookFormat(format: BookFormatType): format is CheckoutBookFormat {
  return CHECKOUT_BOOK_FORMATS.includes(format as CheckoutBookFormat);
}

export function sortFormatsByPriority<T extends { format: BookFormatType }>(formats: readonly T[]) {
  return [...formats].sort((left, right) => (FORMAT_ORDER.get(left.format) ?? 99) - (FORMAT_ORDER.get(right.format) ?? 99));
}

export function findPreferredFormat<T extends { format: BookFormatType }>(
  formats: readonly T[] | null | undefined,
  priorities: readonly BookFormatType[],
) {
  const priorityMap = new Map<BookFormatType, number>(priorities.map((format, index) => [format, index]));

  return [...(formats ?? [])].sort((left, right) => (priorityMap.get(left.format) ?? 99) - (priorityMap.get(right.format) ?? 99))[0] ?? null;
}

export function createEmptyFormatBreakdown() {
  return Object.fromEntries(BOOK_FORMATS.map((format) => [format, 0])) as Record<BookFormatType, number>;
}
