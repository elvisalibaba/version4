/**
 * Copie les couvertures du bucket privé « books » vers le bucket public « covers », en les
 * optimisant, puis met à jour books.cover_url, cover_thumbnail_url et cover_bucket = 'covers'.
 *
 * Pour chaque livre :
 *   - couverture : l'original est gardé tel quel s'il fait moins de 300 Ko, mesure au plus
 *     1200 px de haut et est en JPEG, PNG ou WebP ; sinon il est redimensionné à 1200 px de
 *     haut maximum et converti en WebP (qualité 82, abaissée si besoin pour passer sous 300 Ko) ;
 *   - miniature : WebP de 400 px de large (cartes du catalogue).
 * Clés : <book_id>/cover.<ext> et <book_id>/thumbnail.webp.
 *
 * Idempotent : un livre déjà sur « covers » dont les objets existent est ignoré (sauf --force) ;
 * les envois écrasent la cible (upsert) ; la mise à jour n'a lieu que si cover_url n'a pas changé.
 * Les objets d'origine du bucket « books » ne sont PAS supprimés.
 *
 * Usage (Node ≥ 23) :
 *   NEXT_PUBLIC_HOLISTIC_SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… \
 *     node scripts/migrate-covers-to-supabase.ts [--dry-run] [--force]
 */
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

type BookRow = {
  id: string;
  title: string;
  cover_url: string | null;
  cover_thumbnail_url: string | null;
  cover_bucket: string;
};
type Encoded = { buffer: Buffer; ext: string; contentType: string; width: number; height: number };

const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");
const MAX_COVER_HEIGHT = 1200;
const KEEP_ORIGINAL_BELOW = 300 * 1024;
const THUMB_WIDTH = 400;
const KEEPABLE: Record<string, { ext: string; type: string }> = {
  jpeg: { ext: "jpg", type: "image/jpeg" },
  png: { ext: "png", type: "image/png" },
  webp: { ext: "webp", type: "image/webp" },
};

const url = process.env.NEXT_PUBLIC_HOLISTIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Variables manquantes : NEXT_PUBLIC_HOLISTIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(2);
}
const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

async function exists(bucket: string, key: string): Promise<boolean> {
  const slash = key.lastIndexOf("/");
  const { data, error } = await db.storage.from(bucket).list(key.slice(0, slash), { search: key.slice(slash + 1), limit: 100 });
  if (error) throw new Error(`Liste ${bucket}/${key} : ${error.message}`);
  return (data ?? []).some((item) => item.name === key.slice(slash + 1));
}

async function encodeCover(original: Buffer): Promise<Encoded> {
  const meta = await sharp(original).metadata();
  const keep = meta.format ? KEEPABLE[meta.format] : undefined;
  if (keep && original.length < KEEP_ORIGINAL_BELOW && (meta.height ?? 0) <= MAX_COVER_HEIGHT) {
    return { buffer: original, ext: keep.ext, contentType: keep.type, width: meta.width ?? 0, height: meta.height ?? 0 };
  }
  // Qualité 82, abaissée par paliers si le fichier dépasse encore 300 Ko.
  for (const quality of [82, 74, 66, 58]) {
    const { data, info } = await sharp(original)
      .rotate()
      .resize({ height: MAX_COVER_HEIGHT, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer({ resolveWithObject: true });
    if (data.length < KEEP_ORIGINAL_BELOW || quality === 58) {
      return { buffer: data, ext: "webp", contentType: "image/webp", width: info.width, height: info.height };
    }
  }
  throw new Error("encodage impossible");
}

async function encodeThumbnail(original: Buffer): Promise<Encoded> {
  const { data, info } = await sharp(original)
    .rotate()
    .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toBuffer({ resolveWithObject: true });
  return { buffer: data, ext: "webp", contentType: "image/webp", width: info.width, height: info.height };
}

async function upload(key: string, file: Encoded) {
  const { error } = await db.storage.from("covers").upload(key, file.buffer, {
    contentType: file.contentType,
    cacheControl: "604800",
    upsert: true,
  });
  if (error) throw new Error(`Envoi covers/${key} : ${error.message}`);
}

const { data: books, error } = await db.from("books").select("id,title,cover_url,cover_thumbnail_url,cover_bucket").order("title");
if (error) {
  console.error("Lecture des livres impossible :", error.message);
  process.exit(1);
}

const ko = (bytes: number) => `${Math.round(bytes / 1024)} Ko`;
const problems: string[] = [];
let before = 0;
let after = 0;
console.log(DRY_RUN ? "\n=== DRY-RUN : aucune écriture ===\n" : "\n=== EXÉCUTION ===\n");

for (const book of (books ?? []) as BookRow[]) {
  const label = book.title.slice(0, 44).padEnd(44);
  if (!book.cover_url) {
    console.log(`repli (sans couverture)          ${label}`);
    continue;
  }
  if (book.cover_bucket === "covers" && !FORCE) {
    const ok = await exists("covers", book.cover_url) && (!book.cover_thumbnail_url || await exists("covers", book.cover_thumbnail_url));
    console.log(`${ok ? "déjà migré" : "⚠ objet covers manquant"}`.padEnd(33) + label);
    if (!ok) problems.push(`${book.title} : objet covers/${book.cover_url} introuvable`);
    continue;
  }
  // Seuls les formats d'image web sont repris ; le reste (ex. photo brute .dng) garde la couverture de repli.
  const sourceExt = book.cover_url.split(".").pop()?.toLowerCase() ?? "";
  if (!["jpg", "jpeg", "png", "webp", "avif"].includes(sourceExt)) {
    console.log(`repli (format .${sourceExt})`.padEnd(33) + label);
    problems.push(`${book.title} : source .${sourceExt} non reprise — couverture de repli conservée`);
    continue;
  }
  const sourceBucket = book.cover_bucket === "covers" ? "covers" : "books";
  const { data: blob, error: downloadError } = await db.storage.from(sourceBucket).download(book.cover_url);
  if (downloadError || !blob) {
    console.log(`⚠ source introuvable              ${label}`);
    problems.push(`${book.title} : ${sourceBucket}/${book.cover_url} introuvable`);
    continue;
  }
  const original = Buffer.from(await blob.arrayBuffer());
  let cover: Encoded;
  let thumb: Encoded;
  try {
    cover = await encodeCover(original);
    thumb = await encodeThumbnail(original);
  } catch (err) {
    console.log(`repli (format non lisible)       ${label}  ${book.cover_url.split(".").pop()}`);
    problems.push(`${book.title} : image non lisible (${err instanceof Error ? err.message : "format"}) — couverture de repli conservée`);
    continue;
  }
  const coverKey = `${book.id}/cover.${cover.ext}`;
  const thumbKey = `${book.id}/thumbnail.webp`;
  before += original.length;
  after += cover.buffer.length + thumb.buffer.length;
  const action = cover.buffer === original ? "original gardé" : "→ WebP";
  console.log(
    `${action.padEnd(33)}${label}  ${ko(original.length).padStart(7)} → ${ko(cover.buffer.length).padStart(6)} ` +
      `(${cover.width}×${cover.height})  miniature ${ko(thumb.buffer.length)} (${thumb.width}×${thumb.height})`,
  );
  if (DRY_RUN) continue;

  await upload(coverKey, cover);
  await upload(thumbKey, thumb);
  const { data: updated, error: updateError } = await db
    .from("books")
    .update({ cover_bucket: "covers", cover_url: coverKey, cover_thumbnail_url: thumbKey })
    .eq("id", book.id)
    .eq("cover_url", book.cover_url)
    .select("id");
  if (updateError || !updated?.length) {
    problems.push(`${book.title} : envoyé mais non référencé (${updateError?.message ?? "cover_url modifié entre-temps"})`);
  }
}

console.log(`\nVolume : ${ko(before)} d'originaux → ${ko(after)} (couvertures + miniatures)`);
if (problems.length) {
  console.log("\nRapport :");
  for (const problem of problems) console.log(` - ${problem}`);
}
process.exit(problems.some((problem) => !problem.includes("repli")) ? 1 : 0);
