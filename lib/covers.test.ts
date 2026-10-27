import { describe, expect, it } from "vitest";
import { coverImageLoader, stableCoverUrl } from "./covers";

describe("couvertures publiques Laravel", () => {
  const cover = "https://api.aba.cd/storage/covers/book/cover.jpg";
  const thumb = "https://api.aba.cd/storage/covers/book/thumbnail.webp";

  it("utilise les URL HTTPS fournies par Laravel", () => {
    expect(stableCoverUrl({ cover_url: cover })).toBe(cover);
    expect(stableCoverUrl({ cover_url: thumb })).toBe(thumb);
  });

  it("refuse les chemins internes et les URL non sécurisées", () => {
    expect(stableCoverUrl({ cover_url: "../books/files/x.pdf" })).toBeNull();
    expect(stableCoverUrl({ cover_url: "covers/author/x.jpg" })).toBeNull();
    expect(stableCoverUrl({ cover_url: "http://example.com/x.jpg" })).toBeNull();
    expect(stableCoverUrl({ cover_url: null })).toBeNull();
  });

  it("préfère la miniature lorsque Laravel l'a fournie", () => {
    const book = { cover_url: cover, cover_thumbnail_url: thumb };
    expect(stableCoverUrl(book, true)).toBe(thumb);
    expect(stableCoverUrl({ ...book, cover_thumbnail_url: null }, true)).toBe(cover);
  });

  it("ne transforme pas les URL de couvertures", () => {
    expect(coverImageLoader({ src: thumb, width: 320 })).toBe(thumb);
  });
});
