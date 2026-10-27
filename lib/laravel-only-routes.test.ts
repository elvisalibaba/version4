import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";

const routes = [
  "app/api/auth/login/route.ts",
  "app/api/auth/register/route.ts",
  "app/api/auth/logout/route.ts",
  "app/api/auth/me/route.ts",
  "app/api/auth/forgot-password/route.ts",
  "app/api/auth/reset-password/route.ts",
  "app/api/auth/verify-email/route.ts",
  "app/api/auth/resend-verification/route.ts",
  "app/api/read/[bookId]/route.ts",
  "app/api/read/[bookId]/file/route.ts",
  "app/api/backend/[...path]/route.ts",
  "components/books/favorite-book-button.tsx",
  "components/books/book-reviews.tsx",
  "proxy.ts",
];

describe("frontend exclusively served by Laravel", () => {
  it.each(routes)("%s does not import or call a retired database backend", (path) => {
    const contents = readFileSync(path, "utf8");
    expect(contents).not.toMatch(/supabase/i);
  });

  it("does not expose obsolete database routes", () => {
    expect(existsSync("app/api/supabase/books/route.ts")).toBe(false);
    expect(existsSync("app/api/supabase/orders/route.ts")).toBe(false);
    expect(existsSync("lib/supabase/server.ts")).toBe(false);
  });

  it("does not bundle the retired authentication SDK", () => {
    const manifest = JSON.parse(readFileSync("package.json", "utf8"));
    expect(manifest.dependencies["@supabase/ssr"]).toBeUndefined();
    expect(manifest.dependencies["@supabase/supabase-js"]).toBeUndefined();
  });
});
