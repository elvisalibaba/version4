export const SITE_NAME = "Holistique Books";
export const SITE_DESCRIPTION =
  "Librairie numérique et maison éditoriale : découvrez des livres, lisez en ligne et publiez vos œuvres avec un accompagnement professionnel.";
export const DEFAULT_SITE_URL = "https://www.holistique-books.com";

export function getSiteUrl() {
  const candidate = process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.APP_BASE_URL?.trim();

  try {
    return new URL(candidate || DEFAULT_SITE_URL);
  } catch {
    return new URL(DEFAULT_SITE_URL);
  }
}

export function absoluteUrl(path = "/") {
  return new URL(path, getSiteUrl()).toString();
}
