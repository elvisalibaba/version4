const API_URL = (
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000"
).replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly payload: unknown,
  ) {
    super(`API request failed with status ${status}`);
  }
}

type ApiClientOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | Record<string, unknown> | null;
  token?: string | null;
};

export async function apiClient<T>(path: string, options: ApiClientOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const isStructuredBody =
    options.body !== null &&
    typeof options.body === "object" &&
    !(options.body instanceof FormData) &&
    !(options.body instanceof Blob) &&
    !(options.body instanceof URLSearchParams);

  if (isStructuredBody) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}/api/v1/${path.replace(/^\//, "")}`, {
    ...options,
    headers,
    body: isStructuredBody ? JSON.stringify(options.body) : (options.body as BodyInit | null | undefined),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null);

  if (!response.ok) {
    throw new ApiError(response.status, payload);
  }

  return payload as T;
}

export function getApiBaseUrl() {
  return API_URL;
}
