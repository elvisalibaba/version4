import { describe, expect, it } from "vitest";
import { getSafeNextPath } from "./safe-next-path";

describe("getSafeNextPath", () => {
  it("keeps internal application paths", () => {
    expect(getSafeNextPath("/dashboard/reader/library?tab=recent")).toBe("/dashboard/reader/library?tab=recent");
  });

  it.each(["https://evil.example", "//evil.example", "javascript:alert(1)", "dashboard"]) (
    "rejects unsafe redirect %s",
    (value) => expect(getSafeNextPath(value)).toBe("/dashboard"),
  );
});
