import "server-only";

import type { PublishedBook } from "@/lib/books";
import { readJsonFile, writeJsonFile } from "@/lib/content-storage";
import { createServiceRoleClient } from "@/lib/supabase/service";
import type { Database } from "@/types/database";

const FLASH_SALES_FILE_PATH = "data/flash-sales.json";
const FLASH_SALE_DISPLAY_LIMIT = 3;
const FLASH_SALE_SCOPE = "global";

type FlashSaleConfigRow = Database["public"]["Tables"]["flash_sale_configs"]["Row"];

export type FlashSaleConfig = {
  selectedBookIds: string[];
  discountPercentage: number;
  updatedAt: string;
};

const defaultFlashSaleConfig: FlashSaleConfig = {
  selectedBookIds: [],
  discountPercentage: 20,
  updatedAt: "2026-03-15T00:00:00.000Z",
};

function normalizeFlashSaleConfig(config: FlashSaleConfig): FlashSaleConfig {
  const discountPercentage = Number.isFinite(config.discountPercentage) ? Number(config.discountPercentage) : defaultFlashSaleConfig.discountPercentage;

  return {
    selectedBookIds: Array.from(new Set((config.selectedBookIds ?? []).filter(Boolean))),
    discountPercentage: Math.min(90, Math.max(0, Math.round(discountPercentage))),
    updatedAt: config.updatedAt || new Date().toISOString(),
  };
}

function mapRowToFlashSaleConfig(row: FlashSaleConfigRow): FlashSaleConfig {
  return normalizeFlashSaleConfig({
    selectedBookIds: row.selected_book_ids ?? [],
    discountPercentage: row.discount_percentage,
    updatedAt: row.updated_at,
  });
}

function getFlashSaleClient() {
  try {
    return createServiceRoleClient();
  } catch {
    return null;
  }
}

async function readLegacyFlashSaleConfig() {
  const config = await readJsonFile<FlashSaleConfig>(FLASH_SALES_FILE_PATH, defaultFlashSaleConfig);
  return normalizeFlashSaleConfig(config);
}

async function writeLegacyFlashSaleConfig(config: FlashSaleConfig) {
  const normalized = normalizeFlashSaleConfig(config);
  await writeJsonFile(FLASH_SALES_FILE_PATH, normalized);
  return normalized;
}

async function readSupabaseFlashSaleConfig() {
  const supabase = getFlashSaleClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.from("flash_sale_configs").select("*").eq("scope", FLASH_SALE_SCOPE).maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapRowToFlashSaleConfig(data as FlashSaleConfigRow);
}

async function saveSupabaseFlashSaleConfig(config: FlashSaleConfig) {
  const supabase = getFlashSaleClient();

  if (!supabase) {
    return null;
  }

  const normalized = normalizeFlashSaleConfig({
    ...config,
    updatedAt: new Date().toISOString(),
  });

  const { data, error } = await supabase
    .from("flash_sale_configs")
    .upsert(
      {
        scope: FLASH_SALE_SCOPE,
        selected_book_ids: normalized.selectedBookIds,
        discount_percentage: normalized.discountPercentage,
        updated_at: normalized.updatedAt,
      },
      { onConflict: "scope" },
    )
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapRowToFlashSaleConfig(data as FlashSaleConfigRow);
}

export async function getFlashSaleConfig() {
  const supabaseConfig = await readSupabaseFlashSaleConfig();

  if (supabaseConfig) {
    return supabaseConfig;
  }

  const legacyConfig = await readLegacyFlashSaleConfig();
  const savedConfig = await saveSupabaseFlashSaleConfig(legacyConfig);

  return savedConfig ?? legacyConfig;
}

export async function saveFlashSaleConfig(config: FlashSaleConfig) {
  const normalized = normalizeFlashSaleConfig({
    ...config,
    updatedAt: new Date().toISOString(),
  });

  const savedConfig = await saveSupabaseFlashSaleConfig(normalized);

  if (savedConfig) {
    return savedConfig;
  }

  return writeLegacyFlashSaleConfig(normalized);
}

export async function updateFlashSaleDiscount(discountPercentage: number) {
  const currentConfig = await getFlashSaleConfig();
  return saveFlashSaleConfig({
    ...currentConfig,
    discountPercentage,
  });
}

export async function addBookToFlashSale(bookId: string) {
  const currentConfig = await getFlashSaleConfig();
  return saveFlashSaleConfig({
    ...currentConfig,
    selectedBookIds: [...currentConfig.selectedBookIds, bookId],
  });
}

export async function removeBookFromFlashSale(bookId: string) {
  const currentConfig = await getFlashSaleConfig();
  return saveFlashSaleConfig({
    ...currentConfig,
    selectedBookIds: currentConfig.selectedBookIds.filter((id) => id !== bookId),
  });
}

export async function clearFlashSaleBooks() {
  const currentConfig = await getFlashSaleConfig();
  return saveFlashSaleConfig({
    ...currentConfig,
    selectedBookIds: [],
  });
}

export async function getFlashSaleState(books: PublishedBook[]) {
  const config = await getFlashSaleConfig();
  const eligibleBooks = books.filter((book) => book.is_single_sale_enabled && !book.is_free);
  const eligibleBooksById = new Map(eligibleBooks.map((book) => [book.id, book]));
  const selectedBooks = config.selectedBookIds
    .map((bookId) => eligibleBooksById.get(bookId) ?? null)
    .filter((book): book is PublishedBook => Boolean(book));
  const invalidBookIds = config.selectedBookIds.filter((bookId) => !eligibleBooksById.has(bookId));
  const fallbackBooks = eligibleBooks.slice(0, FLASH_SALE_DISPLAY_LIMIT);
  const dealBooks: Array<PublishedBook | null> = [...selectedBooks];

  eligibleBooks.forEach((book) => {
    if (dealBooks.length >= FLASH_SALE_DISPLAY_LIMIT) return;
    if (dealBooks.some((entry) => entry?.id === book.id)) return;
    dealBooks.push(book);
  });

  while (dealBooks.length < FLASH_SALE_DISPLAY_LIMIT) {
    dealBooks.push(null);
  }

  return {
    config,
    eligibleBooks,
    selectedBooks,
    invalidBookIds,
    fallbackBooks,
    dealBooks: dealBooks.slice(0, FLASH_SALE_DISPLAY_LIMIT),
    hasCustomSelection: selectedBooks.length > 0,
  };
}
