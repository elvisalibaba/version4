import { describe, expect, it } from "vitest";
import { activeCatalogueFilters, catalogueApiQuery, catalogueHref, parseCatalogueFilters, toggleFormat } from "./catalogue-filters";

describe("catalogue filters", () => {
  it("parses known values and drops unknown ones", () => {
    const filters = parseCatalogueFilters({ editorial_pole: "ecclesial", work_type: "spaceship", format: "ebook,vinyl,ebook", sort: "random", page: "3", is_free: "true" });

    expect(filters).toMatchObject({ editorial_pole: "ecclesial", work_type: "", format: ["ebook"], sort: "newest", page: 3, is_free: true });
  });

  it("keeps legacy links working", () => {
    expect(parseCatalogueFilters({ access: "free", q: "Prière" })).toMatchObject({ is_free: true, search: "Prière" });
  });

  it("resets the page when a filter changes", () => {
    const filters = parseCatalogueFilters({ category: "Roman", page: "4" });

    expect(catalogueHref(filters, { sort: "price_asc" })).toBe("/librairie?category=Roman&sort=price_asc");
    expect(catalogueHref(filters, { page: 5 })).toBe("/librairie?category=Roman&page=5");
  });

  it("toggles formats in and out", () => {
    const filters = parseCatalogueFilters({ format: "ebook" });

    expect(toggleFormat(filters, "audiobook")).toEqual(["ebook", "audiobook"]);
    expect(toggleFormat(filters, "ebook")).toEqual([]);
  });

  it("builds the API query with the page size", () => {
    expect(catalogueApiQuery(parseCatalogueFilters({ format: "paperback", subscription: "1" }))).toBe("format=paperback&subscription=1&per_page=24");
  });

  it("lists active filters with a removal link each", () => {
    const active = activeCatalogueFilters(parseCatalogueFilters({ work_type: "novel", has_sample: "1" }));

    expect(active).toEqual([
      { key: "work_type", label: "Roman", href: "/librairie?has_sample=1" },
      { key: "has_sample", label: "Extrait disponible", href: "/librairie?work_type=novel" },
    ]);
  });
});
