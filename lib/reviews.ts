export type ReviewSort = "recent" | "helpful";

export type BookReview = {
  id: string;
  rating: number;
  text: string | null;
  helpful_count: number;
  verified_purchase: boolean;
  is_mine: boolean;
  author: {
    name: string;
  };
  created_at: string;
  updated_at: string;
};

export type ReviewsResponse = {
  data: BookReview[];
  current_user_review: BookReview | null;
  can_review?: boolean | null;
  summary?: {
    rating_avg: number | null;
    reviews_count: number;
  };
  links?: {
    first?: string | null;
    last?: string | null;
    prev?: string | null;
    next?: string | null;
  };
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
  };
};

export function buildReviewsPath(
  bookId: string,
  options: { sort?: ReviewSort; page?: number; perPage?: number } = {},
) {
  const params = new URLSearchParams();
  params.set("sort", options.sort ?? "recent");
  params.set("page", String(Math.max(1, options.page ?? 1)));
  params.set("per_page", String(Math.min(50, Math.max(1, options.perPage ?? 8))));

  return "/api/backend/books/" + encodeURIComponent(bookId) + "/reviews?" + params.toString();
}

export function formatReviewSummary(
  ratingAvg: number | null | undefined,
  ratingsCount: number | null | undefined,
) {
  const count = Math.max(0, Number(ratingsCount ?? 0));

  if (!count || ratingAvg === null || ratingAvg === undefined) {
    return "Pas encore d’avis";
  }

  const average = Number(ratingAvg);
  return average.toFixed(1) + "/5 · " + count + " avis";
}

export function reviewErrorMessage(payload: unknown, fallback = "Une erreur est survenue.") {
  if (!payload || typeof payload !== "object") return fallback;

  const body = payload as {
    message?: unknown;
    errors?: Record<string, unknown>;
  };

  const ratingErrors = body.errors?.rating;
  if (Array.isArray(ratingErrors) && typeof ratingErrors[0] === "string") {
    return ratingErrors[0];
  }

  if (typeof body.message === "string" && body.message.trim()) {
    return body.message;
  }

  return fallback;
}
