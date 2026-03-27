export function isExternalMobileAppUrl(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  return /^https?:\/\//i.test(value.trim());
}

export function extractMobileAppFileName(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";

  if (!normalized) {
    return null;
  }

  if (!isExternalMobileAppUrl(normalized)) {
    const segments = normalized.split("/");
    return segments.at(-1)?.trim() || null;
  }

  try {
    const url = new URL(normalized);
    const segments = url.pathname.split("/").filter(Boolean);
    return segments.at(-1)?.trim() || null;
  } catch {
    return null;
  }
}
