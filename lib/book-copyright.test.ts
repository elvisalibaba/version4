import { describe, expect, it } from "vitest";
import { isBookCopyrightBlocked, isBookCopyrightCleared } from "./book-copyright";

describe("book copyright publication rules", () => {
  it("only exposes explicitly cleared books", () => {
    expect(isBookCopyrightCleared("clear")).toBe(true);
    expect(isBookCopyrightCleared("review")).toBe(false);
    expect(isBookCopyrightCleared("blocked")).toBe(false);
    expect(isBookCopyrightCleared(null)).toBe(false);
  });

  it("identifies an explicit block", () => {
    expect(isBookCopyrightBlocked("blocked")).toBe(true);
    expect(isBookCopyrightBlocked("review")).toBe(false);
  });
});
