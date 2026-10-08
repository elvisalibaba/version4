/**
 * Filtres de la librairie : lecture depuis l'URL, construction des liens
 * (ajout / retrait d'un filtre) et paramètres envoyés à GET /api/v1/books.
 * Module pur, sans dépendance au framework, pour rester testable.
 */

export const CATALOGUE_SORTS = [
  { value: "newest", label: "Nouveautés" },
  { value: "bestsellers", label: "Meilleures ventes" },
  { value: "rating", label: "Mieux notés" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
] as const;

export const EDITORIAL_POLES = [
  { value: "ecclesial", label: "Ecclésial" },
  { value: "institutional", label: "Institutionnel" },
  { value: "entrepreneurial", label: "Entrepreneurial" },
  { value: "general", label: "Général" },
] as const;

export const WORK_TYPES = [
  { value: "book", label: "Livre" },
  { value: "novel", label: "Roman" },
  { value: "essay", label: "Essai" },
  { value: "biography", label: "Biographie" },
  { value: "bible", label: "Bible" },
  { value: "theology", label: "Théologie" },
  { value: "devotional", label: "Dévotion" },
  { value: "sermon", label: "Prédication" },
  { value: "prayer", label: "Prière" },
  { value: "hymnal", label: "Recueil de chants" },
  { value: "study_guide", label: "Guide d’étude" },
  { value: "academic", label: "Ouvrage académique" },
  { value: "manual", label: "Manuel" },
  { value: "magazine", label: "Magazine" },
  { value: "report", label: "Rapport" },
  { value: "other", label: "Autre" },
] as const;

export const CATALOGUE_FORMATS = [
  { value: "holistique_store", label: "Lecture en ligne" },
  { value: "ebook", label: "eBook" },
  { value: "paperback", label: "Broché" },
  { value: "pocket", label: "Poche" },
  { value: "hardcover", label: "Relié" },
  { value: "audiobook", label: "Audio" },
] as const;

export const ACCESS_FILTERS = [
  { key: "is_free", label: "Gratuit" },
  { key: "subscription", label: "Inclus dans l’abonnement" },
  { key: "has_sample", label: "Extrait disponible" },
] as const;

export type CatalogueSort = (typeof CATALOGUE_SORTS)[number]["value"];
export type AccessKey = (typeof ACCESS_FILTERS)[number]["key"];

export type CatalogueFilters = {
  search: string;
  editorial_pole: string;
  work_type: string;
  category: string;
  format: string[];
  is_free: boolean;
  subscription: boolean;
  has_sample: boolean;
  sort: CatalogueSort;
  page: number;
};

export type RawSearchParams = Record<string, string | string[] | undefined>;

export const CATALOGUE_PER_PAGE = 24;

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

function isOneOf<T extends string>(value: string, options: readonly { value: T }[]): value is T {
  return options.some((option) => option.value === value);
}

function flag(value: string | string[] | undefined) {
  return ["1", "true"].includes(first(value).toLowerCase());
}

/** Lit l'URL ; les valeurs inconnues sont ignorées plutôt que de produire une erreur. */
export function parseCatalogueFilters(params: RawSearchParams): CatalogueFilters {
  const sort = first(params.sort);
  const pole = first(params.editorial_pole);
  const workType = first(params.work_type);
  const page = Number.parseInt(first(params.page), 10);
  const formats = (Array.isArray(params.format) ? params.format : first(params.format).split(","))
    .map((value) => value.trim())
    .filter((value, index, all) => isOneOf(value, CATALOGUE_FORMATS) && all.indexOf(value) === index);

  return {
    // `q` : ancien paramètre de recherche du header.
    search: (first(params.search) || first(params.q)).slice(0, 120),
    editorial_pole: isOneOf(pole, EDITORIAL_POLES) ? pole : "",
    work_type: isOneOf(workType, WORK_TYPES) ? workType : "",
    category: first(params.category).slice(0, 120),
    format: formats,
    // `access=free` : ancien lien « Lire gratuitement ».
    is_free: flag(params.is_free) || first(params.access) === "free",
    subscription: flag(params.subscription),
    has_sample: flag(params.has_sample),
    sort: isOneOf(sort, CATALOGUE_SORTS) ? sort : "newest",
    page: Number.isFinite(page) && page > 1 ? page : 1,
  };
}

/** Paramètres d'URL canoniques (valeurs par défaut omises). */
export function catalogueSearchParams(filters: CatalogueFilters) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.editorial_pole) params.set("editorial_pole", filters.editorial_pole);
  if (filters.work_type) params.set("work_type", filters.work_type);
  if (filters.category) params.set("category", filters.category);
  if (filters.format.length) params.set("format", filters.format.join(","));
  for (const { key } of ACCESS_FILTERS) if (filters[key]) params.set(key, "1");
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (filters.page > 1) params.set("page", String(filters.page));
  return params;
}

/** URL de la librairie après modification ; tout changement de filtre revient en page 1. */
export function catalogueHref(filters: CatalogueFilters, changes: Partial<CatalogueFilters> = {}) {
  const next = { ...filters, page: 1, ...changes };
  const query = catalogueSearchParams(next).toString();
  return query ? `/librairie?${query}` : "/librairie";
}

export function toggleFormat(filters: CatalogueFilters, format: string) {
  return filters.format.includes(format) ? filters.format.filter((value) => value !== format) : [...filters.format, format];
}

/** Requête envoyée à l'API (mêmes noms de paramètres, plus la taille de page). */
export function catalogueApiQuery(filters: CatalogueFilters) {
  const params = catalogueSearchParams(filters);
  params.set("per_page", String(CATALOGUE_PER_PAGE));
  return params.toString();
}

export type ActiveFilter = { key: string; label: string; href: string };

/** Filtres actifs, chacun avec le lien qui le retire. */
export function activeCatalogueFilters(filters: CatalogueFilters): ActiveFilter[] {
  const active: ActiveFilter[] = [];
  if (filters.search) active.push({ key: "search", label: `« ${filters.search} »`, href: catalogueHref(filters, { search: "" }) });
  if (filters.editorial_pole) {
    const label = EDITORIAL_POLES.find((pole) => pole.value === filters.editorial_pole)?.label ?? filters.editorial_pole;
    active.push({ key: "editorial_pole", label: `Pôle ${label.toLowerCase()}`, href: catalogueHref(filters, { editorial_pole: "" }) });
  }
  if (filters.work_type) {
    const label = WORK_TYPES.find((type) => type.value === filters.work_type)?.label ?? filters.work_type;
    active.push({ key: "work_type", label, href: catalogueHref(filters, { work_type: "" }) });
  }
  if (filters.category) active.push({ key: "category", label: filters.category, href: catalogueHref(filters, { category: "" }) });
  for (const format of filters.format) {
    const label = CATALOGUE_FORMATS.find((item) => item.value === format)?.label ?? format;
    active.push({ key: `format-${format}`, label, href: catalogueHref(filters, { format: toggleFormat(filters, format) }) });
  }
  for (const access of ACCESS_FILTERS) {
    if (filters[access.key]) active.push({ key: access.key, label: access.label, href: catalogueHref(filters, { [access.key]: false }) });
  }
  return active;
}
