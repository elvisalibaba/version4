import { describe, expect, it } from "vitest";
import { isValidBookId, publicBookCoverUrl } from "./book-cover-url";
describe("public book cover paths", () => {
  const id = "e53fbed9-7f51-47e9-a513-f71926b99b96";
  it("accepts a full five-section book UUID", () => {
    expect(isValidBookId(id)).toBe(true);
    expect(publicBookCoverUrl(id)).toBe("/api/covers/" + id);
  });
  it("rejects malformed and shortened IDs", () => {
    expect(isValidBookId("e53fbed9-7f51-47e9-a513-f71926b99b9")).toBe(false);
    expect(isValidBookId("e53fbed9-7f51-a513-f71926b99b96")).toBe(false);
    expect(publicBookCoverUrl("../../files/secret.pdf")).toBe(null);
  });
});
