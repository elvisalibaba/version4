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
    const candidate = segments.at(-1)?.trim() || null;
    return candidate && candidate.toLowerCase().endsWith(".apk")
      ? candidate
      : null;
  }

  try {
    const url = new URL(normalized);
    const queryFileName = url.searchParams.get("filename")?.trim() ?? "";

    if (queryFileName && queryFileName.toLowerCase().endsWith(".apk")) {
      return queryFileName;
    }

    const segments = url.pathname.split("/").filter(Boolean);
    const candidate = segments.at(-1)?.trim() || null;

    if (!candidate) {
      return null;
    }

    const lowerCandidate = candidate.toLowerCase();
    if (lowerCandidate === "download" || lowerCandidate === "uc") {
      return null;
    }

    return lowerCandidate.endsWith(".apk") ? candidate : null;
  } catch {
    return null;
  }
}
