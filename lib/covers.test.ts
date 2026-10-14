import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { coverImageLoader, publicCoverUrl, stableCoverUrl } from "./covers";

const BASE = "https://example.supabase.co";

describe("couvertures publiques", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_HOLISTIC_SUPABASE_URL = BASE + "/";
  });
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_HOLISTIC_SUPABASE_URL;
  });

  it("construit l'URL publique stable du bucket covers", () => {
    expect(publicCoverUrl("abc/cover.jpg")).toBe(`${BASE}/storage/v1/object/public/covers/abc/cover.jpg`);
    expect(publicCoverUrl("abc/ma couverture.png")).toBe(`${BASE}/storage/v1/object/public/covers/abc/ma%20couverture.png`);
  });

  it("refuse les chemins remontants", () => {
    expect(publicCoverUrl("../books/files/x.pdf")).toBeNull();
  });

  it("n'utilise une URL stable que pour le bucket covers ou une URL absolue", () => {
    expect(stableCoverUrl({ cover_url: "id/cover.jpg", cover_bucket: "covers" })).toContain("/object/public/covers/id/cover.jpg");
    expect(stableCoverUrl({ cover_url: "covers/author/x.jpg", cover_bucket: "books" })).toBeNull();
    expect(stableCoverUrl({ cover_url: "https://cdn.example/x.jpg", cover_bucket: "books" })).toBe("https://cdn.example/x.jpg");
    expect(stableCoverUrl({ cover_url: null, cover_bucket: "covers" })).toBeNull();
  });

  it("préfère la miniature quand elle est demandée et présente", () => {
    const book = { cover_url: "id/cover.jpg", cover_thumbnail_url: "id/thumbnail.jpg", cover_bucket: "covers" };
    expect(stableCoverUrl(book, true)).toContain("id/thumbnail.jpg");
    expect(stableCoverUrl({ ...book, cover_thumbnail_url: null }, true)).toContain("id/cover.jpg");
  });

  it("laisse l'URL inchangée tant que les transformations Supabase sont désactivées", () => {
    const src = `${BASE}/storage/v1/object/public/covers/id/cover.jpg`;
    expect(coverImageLoader({ src, width: 320 })).toBe(src);
  });
});
