export type ClientBookEngagementEventType = "detail_view" | "catalog_click" | "reader_open" | "file_access";

const VISITOR_STORAGE_KEY = "holisticbooks_visitor_id";

function getVisitorId() {
  try {
    const existing = window.localStorage.getItem(VISITOR_STORAGE_KEY);
    if (existing) return existing;

    const visitorId = window.crypto.randomUUID();
    window.localStorage.setItem(VISITOR_STORAGE_KEY, visitorId);

    return visitorId;
  } catch {
    return undefined;
  }
}

export function trackBookEngagement(params: {
  bookId: string;
  eventType: ClientBookEngagementEventType;
  source: string;
  metadata?: Record<string, unknown>;
}) {
  void fetch(`/api/backend/books/${encodeURIComponent(params.bookId)}/engagement`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      event_type: params.eventType,
      source: params.source,
      visitor_id: getVisitorId(),
      metadata: params.metadata ?? {},
    }),
    cache: "no-store",
    keepalive: true,
  }).catch(() => undefined);
}
