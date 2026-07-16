export const DEFAULT_AUTH_NEXT_PATH = "/dashboard";

/**
 * Keeps authentication redirects on this application. The value may include a
 * query string or a hash, but never a protocol-relative URL or a backslash.
 */
export function getSafeNextPath(
  value: string | null | undefined,
  fallback = DEFAULT_AUTH_NEXT_PATH,
) {
  const candidate = value?.trim();

  if (
    !candidate ||
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(candidate)
  ) {
    return fallback;
  }

  try {
    const parsed = new URL(candidate, "https://holistique-books.local");

    if (parsed.origin !== "https://holistique-books.local") {
      return fallback;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function withNextPath(pathname: string, nextPath: string) {
  const searchParams = new URLSearchParams({ next: getSafeNextPath(nextPath) });
  return `${pathname}?${searchParams.toString()}`;
}
