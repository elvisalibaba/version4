import { describe, expect, it } from "vitest";
import { buildReviewsPath, formatReviewSummary, reviewErrorMessage } from "./reviews";

describe("reviews helpers", () => {
  it("builds a safe paginated reviews path", () => {
    expect(buildReviewsPath("book/with space", { sort: "helpful", page: 2, perPage: 12 }))
      .toBe("/api/backend/books/book%2Fwith%20space/reviews?sort=helpful&page=2&per_page=12");
  });

  it("formats rating summaries", () => {
    expect(formatReviewSummary(4.25, 12)).toBe("4.3/5 · 12 avis");
    expect(formatReviewSummary(null, 0)).toBe("Pas encore d’avis");
  });

  it("prefers validation errors from the API", () => {
    expect(reviewErrorMessage({
      message: "Validation failed",
      errors: { rating: ["Vous avez déjà publié un avis pour ce livre."] },
    })).toBe("Vous avez déjà publié un avis pour ce livre.");
  });
});
