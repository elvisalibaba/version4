/**
 * Copie les couvertures du bucket privé « books » (books/covers/...) vers le bucket
 * public « covers » sous <book_id>/cover.<ext> (et <book_id>/thumbnail.<ext>), puis met
 * à jour books.cover_url, books.cover_thumbnail_url et books.cover_bucket = 'covers'.
 *
 * Idempotent : un livre déjà sur « covers » dont l'objet existe est ignoré ; les envois
 * écrasent l'objet cible (upsert) ; la mise à jour n'a lieu que si cover_url n'a pas changé
 * entre-temps. Les objets d'origine ne sont PAS supprimés.
 *
 * Usage (Node ≥ 23, types effacés nativement) :
 *   NEXT_PUBLIC_HOLISTIC_SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… \
 *     node scripts/migrate-covers-to-supabase.ts --dry-run
 *   (même commande sans --dry-run pour exécuter)
 */
import { createClient } from "@supabase/supabase-js";

type BookRow = {
  id: string;
  title: string;
  cover_url: string | null;
  cover_thumbnail_url: string | null;
  cover_bucket: string;
};
type Planned = { book: BookRow; cover: string | null; thumb: string | null; note: string; bytes: number };

const DRY_RUN = process.argv.includes("--dry-run");
const url = process.env.NEXT_PUBLIC_HOLISTIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Variables manquantes : NEXT_PUBLIC_HOLISTIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(2);
}
const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

const EXTENSIONS: Record<string, { ext: string; type: string }> = {
  jpg: { ext: "jpg", type: "image/jpeg" },
  jpeg: { ext: "jpg", type: "image/jpeg" },
  png: { ext: "png", type: "image/png" },
  webp: { ext: "webp", type: "image/webp" },
  avif: { ext: "avif", type: "image/avif" },
};

function targetFor(bookId: string, source: string, name: "cover" | "thumbnail") {
  const extension = source.split(".").pop()?.toLowerCase() ?? "";
  const known = EXTENSIONS[extension];
  if (!known) return null;
  return { key: `${bookId}/${name}.${known.ext}`, contentType: known.type };
}

async function objectSize(bucket: string, key: string): Promise<number | null> {
  const slash = key.lastIndexOf("/");
  const { data, error } = await db.storage.from(bucket).list(key.slice(0, slash), { search: key.slice(slash + 1), limit: 100 });
  if (error) throw new Error(`Liste ${bucket}/${key} : ${error.message}`);
  const entry = (data ?? []).find((item) => item.name === key.slice(slash + 1));
  if (!entry) return null;
  return Number((entry.metadata as { size?: number } | null)?.size ?? 0);
}

async function copy(sourceKey: string, target: { key: string; contentType: string }) {
  const { data: blob, error } = await db.storage.from("books").download(sourceKey);
  if (error || !blob) throw new Error(`Téléchargement books/${sourceKey} : ${error?.message ?? "vide"}`);
  const { error: uploadError } = await db.storage.from("covers").upload(target.key, blob, {
    contentType: target.contentType,
    cacheControl: "604800",
    upsert: true,
  });
  if (uploadError) throw new Error(`Envoi covers/${target.key} : ${uploadError.message}`);
}

const { data: books, error } = await db
  .from("books")
  .select("id,title,cover_url,cover_thumbnail_url,cover_bucket")
  .order("title");
if (error) {
  console.error("Lecture des livres impossible :", error.message);
  process.exit(1);
}

const plan: Planned[] = [];
const problems: string[] = [];
for (const book of (books ?? []) as BookRow[]) {
  if (!book.cover_url) {
    plan.push({ book, cover: null, thumb: null, note: "sans couverture (repli affiché)", bytes: 0 });
    continue;
  }
  if (book.cover_bucket === "covers") {
    const size = await objectSize("covers", book.cover_url);
    plan.push({ book, cover: book.cover_url, thumb: book.cover_thumbnail_url, note: size === null ? "⚠ objet covers manquant" : "déjà migré", bytes: size ?? 0 });
    if (size === null) problems.push(`${book.title} : objet covers/${book.cover_url} introuvable`);
    continue;
  }
  const cover = targetFor(book.id, book.cover_url, "cover");
  const sourceSize = await objectSize("books", book.cover_url);
  if (!cover || sourceSize === null) {
    const reason = !cover ? "extension non prise en charge" : "objet source introuvable";
    plan.push({ book, cover: null, thumb: null, note: `⚠ ${reason}`, bytes: 0 });
    problems.push(`${book.title} : books/${book.cover_url} — ${reason}`);
    continue;
  }
  let thumb: { key: string; contentType: string } | null = null;
  if (book.cover_thumbnail_url && book.cover_thumbnail_url !== book.cover_url) {
    thumb = targetFor(book.id, book.cover_thumbnail_url, "thumbnail");
    if (!thumb || (await objectSize("books", book.cover_thumbnail_url)) === null) {
      problems.push(`${book.title} : miniature books/${book.cover_thumbnail_url} ignorée (introuvable ou format)`);
      thumb = null;
    }
  }
  plan.push({ book, cover: cover.key, thumb: thumb?.key ?? null, note: DRY_RUN ? "à copier" : "copie…", bytes: sourceSize });

  if (!DRY_RUN) {
    await copy(book.cover_url, cover);
    if (thumb && book.cover_thumbnail_url) await copy(book.cover_thumbnail_url, thumb);
    const { data: updated, error: updateError } = await db
      .from("books")
      .update({ cover_bucket: "covers", cover_url: cover.key, cover_thumbnail_url: thumb?.key ?? null })
      .eq("id", book.id)
      .eq("cover_url", book.cover_url)
      .select("id");
    if (updateError || !updated?.length) {
      problems.push(`${book.title} : copie faite mais livre non mis à jour (${updateError?.message ?? "cover_url modifié entre-temps"})`);
      plan[plan.length - 1].note = "⚠ copié, non référencé";
    } else {
      plan[plan.length - 1].note = "migré";
    }
  }
}

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} Mo`;
console.log(DRY_RUN ? "\n=== DRY-RUN : aucune écriture ===\n" : "\n=== EXÉCUTION ===\n");
for (const item of plan) {
  console.log(
    `${item.note.padEnd(32)} ${mb(item.bytes).padStart(9)}  ${item.book.title.slice(0, 48).padEnd(48)}  ` +
      `${item.book.cover_bucket}/${item.book.cover_url ?? "—"} → ${item.cover ? `covers/${item.cover}` : "—"}` +
      (item.thumb ? ` (+ covers/${item.thumb})` : ""),
  );
}
const toCopy = plan.filter((item) => item.note === "à copier" || item.note === "migré");
console.log(`\nLivres : ${plan.length} · à copier / copiés : ${toCopy.length} · volume : ${mb(toCopy.reduce((sum, item) => sum + item.bytes, 0))}`);
if (problems.length) {
  console.log("\nRapport — fichiers à fournir ou à vérifier :");
  for (const problem of problems) console.log(` - ${problem}`);
}
process.exit(problems.length ? 1 : 0);
