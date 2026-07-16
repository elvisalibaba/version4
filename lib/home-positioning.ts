import "server-only";

import type { PublishedBook } from "@/lib/books";
import { readJsonFile, writeJsonFile } from "@/lib/content-storage";
import { createServiceRoleClient } from "@/lib/supabase/service";
import type { Database } from "@/types/database";

const HOME_FEATURED_FILE_PATH = "data/home-featured-books.json";
const HOME_FEATURED_SCOPE = "global";
const HOME_FEATURED_PREVIEW_LIMIT = 6;

type HomeFeaturedConfigRow = Database["public"]["Tables"]["home_featured_configs"]["Row"];

export type HomeFeaturedConfig = {
  selectedBookIds: string[];
  updatedAt: string;
};

const defaultHomeFeaturedConfig: HomeFeaturedConfig = {
  selectedBookIds: [],
  updatedAt: "2026-03-18T00:00:00.000Z",
};

function normalizeHomeFeaturedConfig(config: HomeFeaturedConfig): HomeFeaturedConfig {
  return {
    selectedBookIds: Array.from(new Set((config.selectedBookIds ?? []).map((id) => id.trim()).filter(Boolean))),
    updatedAt: config.updatedAt || new Date().toISOString(),
  };
}

function mapRowToHomeFeaturedConfig(row: HomeFeaturedConfigRow): HomeFeaturedConfig {
  return normalizeHomeFeaturedConfig({
    selectedBookIds: row.selected_book_ids ?? [],
    updatedAt: row.updated_at,
  });
}

function getHomeFeaturedClient() {
  try {
    return createServiceRoleClient();
  } catch {
    return null;
  }
}

async function readLegacyHomeFeaturedConfig() {
  const config = await readJsonFile<HomeFeaturedConfig>(HOME_FEATURED_FILE_PATH, defaultHomeFeaturedConfig);
  return normalizeHomeFeaturedConfig(config);
}

async function writeLegacyHomeFeaturedConfig(config: HomeFeaturedConfig) {
  const normalized = normalizeHomeFeaturedConfig(config);
  await writeJsonFile(HOME_FEATURED_FILE_PATH, normalized);
  return normalized;
}

async function readSupabaseHomeFeaturedConfig() {
  const supabase = getHomeFeaturedClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.from("home_featured_configs").select("*").eq("scope", HOME_FEATURED_SCOPE).maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapRowToHomeFeaturedConfig(data as HomeFeaturedConfigRow);
}

async function saveSupabaseHomeFeaturedConfig(config: HomeFeaturedConfig) {
  const supabase = getHomeFeaturedClient();

  if (!supabase) {
    return null;
  }

  const normalized = normalizeHomeFeaturedConfig({
    ...config,
    updatedAt: new Date().toISOString(),
  });

  const { data, error } = await supabase
    .from("home_featured_configs")
    .upsert(
      {
        scope: HOME_FEATURED_SCOPE,
        selected_book_ids: normalized.selectedBookIds,
        updated_at: normalized.updatedAt,
      },
      { onConflict: "scope" },
    )
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapRowToHomeFeaturedConfig(data as HomeFeaturedConfigRow);
}

export async function getHomeFeaturedConfig() {
  const supabaseConfig = await readSupabaseHomeFeaturedConfig();

  if (supabaseConfig) {
    return supabaseConfig;
  }

  const legacyConfig = await readLegacyHomeFeaturedConfig();
  const savedConfig = await saveSupabaseHomeFeaturedConfig(legacyConfig);

  return savedConfig ?? legacyConfig;
}

export async function saveHomeFeaturedConfig(config: HomeFeaturedConfig) {
  const normalized = normalizeHomeFeaturedConfig({
    ...config,
    updatedAt: new Date().toISOString(),
  });

  const savedConfig = await saveSupabaseHomeFeaturedConfig(normalized);

  if (savedConfig) {
    return savedConfig;
  }

  return writeLegacyHomeFeaturedConfig(normalized);
}

export async function addBookToHomeFeatured(bookId: string) {
  const currentConfig = await getHomeFeaturedConfig();
  return saveHomeFeaturedConfig({
    ...currentConfig,
    selectedBookIds: [...currentConfig.selectedBookIds, bookId],
  });
}

export async function removeBookFromHomeFeatured(bookId: string) {
  const currentConfig = await getHomeFeaturedConfig();
  return saveHomeFeaturedConfig({
    ...currentConfig,
    selectedBookIds: currentConfig.selectedBookIds.filter((id) => id !== bookId),
  });
}

export async function clearHomeFeaturedBooks() {
  const currentConfig = await getHomeFeaturedConfig();
  return saveHomeFeaturedConfig({
    ...currentConfig,
    selectedBookIds: [],
  });
}

export async function moveHomeFeaturedBook(bookId: string, direction: "up" | "down") {
  const currentConfig = await getHomeFeaturedConfig();
  const ids = [...currentConfig.selectedBookIds];
  const currentIndex = ids.findIndex((id) => id === bookId);

  if (currentIndex < 0) {
    return currentConfig;
  }

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (targetIndex < 0 || targetIndex >= ids.length) {
    return currentConfig;
  }

  [ids[currentIndex], ids[targetIndex]] = [ids[targetIndex], ids[currentIndex]];

  return saveHomeFeaturedConfig({
    ...currentConfig,
    selectedBookIds: ids,
  });
}

export async function getHomeFeaturedState(books: PublishedBook[]) {
  const config = await getHomeFeaturedConfig();
  const booksById = new Map(books.map((book) => [book.id, book]));
  const selectedBooks = config.selectedBookIds.map((bookId) => booksById.get(bookId) ?? null).filter((book): book is PublishedBook => Boolean(book));
  const selectedBookIds = new Set(selectedBooks.map((book) => book.id));
  const invalidBookIds = config.selectedBookIds.filter((bookId) => !booksById.has(bookId));
  const orderedBooks = [...selectedBooks, ...books.filter((book) => !selectedBookIds.has(book.id))];

  return {
    config,
    eligibleBooks: books,
    selectedBooks,
    invalidBookIds,
    orderedBooks,
    previewBooks: orderedBooks.slice(0, HOME_FEATURED_PREVIEW_LIMIT),
    hasCustomSelection: selectedBooks.length > 0,
  };
}
