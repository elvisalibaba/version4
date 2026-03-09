export const BOOK_CATEGORIES = [
  "Roman",
  "Business",
  "Spiritualite",
  "Jeunesse",
  "Developpement personnel",
  "Auteurs africains",
] as const;

export const HEADER_CATEGORY_ITEMS = [
  { label: "Tous", value: "all" },
  ...BOOK_CATEGORIES.map((category) => ({ label: category, value: category })),
  { label: "Nouveautes", value: "new" },
] as const;

export type BookCategory = (typeof BOOK_CATEGORIES)[number];
export type HeaderCategoryValue = (typeof HEADER_CATEGORY_ITEMS)[number]["value"];

export function isBookCategory(value?: string): value is BookCategory {
  return BOOK_CATEGORIES.some((category) => category === value);
}

export function isHeaderCategoryValue(value?: string): value is HeaderCategoryValue {
  return HEADER_CATEGORY_ITEMS.some((category) => category.value === value);
}
