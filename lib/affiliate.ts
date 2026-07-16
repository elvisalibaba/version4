import type { AffiliateSourceType } from "@/types/database";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeAffiliateCode(value: string | null | undefined) {
  const normalizedValue = value?.trim().toUpperCase();
  return normalizedValue ? normalizedValue : null;
}

export function normalizeAffiliateSourceType(value: string | null | undefined): AffiliateSourceType | null {
  const normalizedValue = value?.trim().toLowerCase();

  if (normalizedValue === "book" || normalizedValue === "livre") {
    return "book";
  }

  if (normalizedValue === "plan" || normalizedValue === "pack" || normalizedValue === "paquet" || normalizedValue === "bundle") {
    return "plan";
  }

  return null;
}

export function isUuidLike(value: string | null | undefined): value is string {
  return Boolean(value && UUID_PATTERN.test(value.trim()));
}

export function buildAffiliateRegisterPath(params: {
  role?: "reader" | "author";
  code?: string | null;
  sourceType?: AffiliateSourceType | null;
  bookId?: string | null;
  planId?: string | null;
}) {
  const searchParams = new URLSearchParams();
  searchParams.set("role", params.role ?? "reader");

  const normalizedCode = normalizeAffiliateCode(params.code);
  if (normalizedCode) {
    searchParams.set("ref", normalizedCode);
  }

  if (params.sourceType) {
    searchParams.set("source", params.sourceType);
  }

  if (params.sourceType === "book" && isUuidLike(params.bookId)) {
    searchParams.set("bookId", params.bookId);
  }

  if (params.sourceType === "plan" && isUuidLike(params.planId)) {
    searchParams.set("planId", params.planId);
  }

  return `/register?${searchParams.toString()}`;
}
