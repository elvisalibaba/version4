import { describe, expect, it } from "vitest";
import { paginationRange } from "./pagination";

describe("paginationRange", () => {
  it("lists every page when there are few", () => {
    expect(paginationRange(2, 3)).toEqual([1, 2, 3]);
  });

  it("collapses distant pages into gaps", () => {
    expect(paginationRange(6, 12)).toEqual([1, "gap", 5, 6, 7, "gap", 12]);
  });

  it("keeps the edges reachable from the first page", () => {
    expect(paginationRange(1, 9)).toEqual([1, 2, "gap", 9]);
  });
});
