<?php

namespace App\Services;

use App\Models\AdminBookImportBatch;
use App\Models\AdminBookImportItem;
use App\Models\AuthorProfile;
use App\Models\Book;
use App\Models\Profile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;
use RuntimeException;
use Throwable;
use ZipArchive;

class AdminBookImportService
{
    public function __construct(
        private BookDocumentMetadataService $metadata,
        private BookTaxonomyService $taxonomy,
    ) {}

    /**
     * Simple multi-file import for a shared or absent author.
     *
     * @param array<int, string> $paths
     */
    public function import(
        array $paths,
        ?AuthorProfile $author,
        Profile $administrator,
        bool $rightsConfirmed = false,
    ): AdminBookImportBatch {
        if ($administrator->role !== 'admin') {
            throw new InvalidArgumentException('Seul un administrateur peut importer plusieurs livres.');
        }

        $paths = array_values(array_unique(array_filter(
            $paths,
            fn (mixed $path): bool => is_string($path) && trim($path) !== '',
        )));

        if ($paths === [] || count($paths) > 50) {
            throw new InvalidArgumentException('Un lot doit contenir entre 1 et 50 livres.');
        }

        $batch = $this->createBatch($administrator, count($paths));

        foreach ($paths as $path) {
            $this->importItem($batch, $path, $author, $administrator, $rightsConfirmed);
        }

        return $this->completeBatch($batch);
    }

    public function importPreparedArchive(string $archivePath, Profile $administrator): AdminBookImportBatch
    {
        if ($administrator->role !== 'admin') {
            throw new InvalidArgumentException('Seul un administrateur peut importer un lot préparé.');
        }

        $disk = Storage::disk('books');

        if (! $disk->exists($archivePath)) {
            throw new RuntimeException('Le fichier ZIP du lot est introuvable.');
        }

        if (! class_exists(ZipArchive::class)) {
            throw new RuntimeException('L’extension PHP ZIP est requise pour importer un lot préparé.');
        }

        $zip = new ZipArchive();
        $result = $zip->open($disk->path($archivePath));

        if ($result !== true) {
            throw new RuntimeException('Impossible d’ouvrir le fichier ZIP du lot.');
        }

        try {
            $entries = $this->entriesFromArchive($zip);

            if ($entries === [] || count($entries) > 50) {
                throw new RuntimeException('Le lot doit contenir entre 1 et 50 livres.');
            }

            $batch = $this->createBatch($administrator, count($entries));

            foreach ($entries as $entry) {
                $this->importPreparedItem($batch, $zip, $entry, $administrator);
            }

            return $this->completeBatch($batch);
        } finally {
            $zip->close();
        }
    }

    /**
     * Accepts, in order:
     * - manifest.json;
     * - catalogue.csv;
     * - or a books/ folder alone.
     *
     * Missing metadata never blocks ingestion. File names are used as fallback titles
     * and covers are paired automatically by base name when possible.
     *
     * @return array<int, array<string, mixed>>
     */
    private function entriesFromArchive(ZipArchive $zip): array
    {
        $manifestRaw = $zip->getFromName('manifest.json');

        if (is_string($manifestRaw) && trim($manifestRaw) !== '') {
            $manifest = json_decode($manifestRaw, true, 512, JSON_THROW_ON_ERROR);
            $entries = $manifest['books'] ?? null;

            if (! is_array($entries)) {
                throw new RuntimeException('manifest.json doit contenir un tableau books.');
            }

            return array_values(array_map(
                fn (mixed $entry): array => is_array($entry) ? $entry : [],
                $entries,
            ));
        }

        $catalogueRaw = $zip->getFromName('catalogue.csv');

        if (is_string($catalogueRaw) && trim($catalogueRaw) !== '') {
            $entries = $this->entriesFromCsv($catalogueRaw);

            if ($entries !== []) {
                return $entries;
            }
        }

        $entries = [];

        for ($index = 0; $index < $zip->numFiles; $index++) {
            $name = $zip->getNameIndex($index);

            if (! is_string($name) || ! str_starts_with($name, 'books/')) {
                continue;
            }

            $extension = mb_strtolower(pathinfo($name, PATHINFO_EXTENSION));

            if (! in_array($extension, ['pdf', 'epub', 'mobi', 'azw3'], true)) {
                continue;
            }

            $base = pathinfo($name, PATHINFO_FILENAME);
            $cover = $this->matchingCoverInArchive($zip, $base);
            $title = $this->titleFromFileName(basename($name));
            $normalizedTitle = Str::lower(Str::ascii($title));
            $isBible = Str::contains($normalizedTitle, ['bible', 'ancien testament', 'nouveau testament']);

            $entries[] = [
                'file' => $name,
                'cover' => $cover,
                'title' => $title,
                'author' => null,
                'authorship_type' => $isBible ? 'sacred_text' : 'anonymous',
                'editorial_pole' => $isBible ? 'ecclesial' : 'general',
                'work_type' => $isBible ? 'bible' : 'book',
            ];
        }

        return $entries;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function entriesFromCsv(string $csv): array
    {
        $stream = fopen('php://temp', 'w+');

        if ($stream === false) {
            return [];
        }

        fwrite($stream, $csv);
        rewind($stream);

        $headers = fgetcsv($stream);

        if (! is_array($headers) || $headers === []) {
            fclose($stream);
            return [];
        }

        $headers = array_map(
            fn (mixed $header): string => Str::of((string) $header)->trim()->lower()->ascii()->replace(' ', '_')->toString(),
            $headers,
        );

        $entries = [];

        while (($row = fgetcsv($stream)) !== false) {
            if ($row === [null] || $row === []) {
                continue;
            }

            $data = [];

            foreach ($headers as $index => $header) {
                $data[$header] = isset($row[$index]) ? trim((string) $row[$index]) : null;
            }

            $file = $data['file'] ?? $data['fichier'] ?? $data['filename'] ?? null;

            if (! is_string($file) || trim($file) === '') {
                continue;
            }

            if (! str_starts_with($file, 'books/')) {
                $file = 'books/'.ltrim($file, '/');
            }

            $cover = $data['cover'] ?? $data['couverture'] ?? null;

            if (is_string($cover) && $cover !== '' && ! str_starts_with($cover, 'covers/')) {
                $cover = 'covers/'.ltrim($cover, '/');
            }

            $entries[] = [
                'file' => $file,
                'cover' => $cover,
                'title' => $data['title'] ?? $data['titre'] ?? null,
                'author' => $data['author'] ?? $data['auteur'] ?? null,
                'author_credit' => $data['author_credit'] ?? $data['credit_auteur'] ?? null,
                'authorship_type' => $data['authorship_type'] ?? $data['type_auteur'] ?? null,
                'publisher' => $data['publisher'] ?? $data['editeur'] ?? null,
                'edition' => $data['edition'] ?? null,
                'isbn' => $data['isbn'] ?? null,
                'language' => $data['language'] ?? $data['langue'] ?? null,
                'editorial_pole' => $data['editorial_pole'] ?? $data['pole_editorial'] ?? null,
                'work_type' => $data['work_type'] ?? $data['type_ouvrage'] ?? null,
            ];
        }

        fclose($stream);

        return $entries;
    }

    private function matchingCoverInArchive(ZipArchive $zip, string $base): ?string
    {
        foreach (['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'] as $extension) {
            $candidate = "covers/{$base}.{$extension}";

            if ($zip->locateName($candidate) !== false) {
                return $candidate;
            }
        }

        return null;
    }

    /**
     * @param array<string, mixed> $entry
     */
    private function importPreparedItem(
        AdminBookImportBatch $batch,
        ZipArchive $zip,
        array $entry,
        Profile $administrator,
    ): void {
        $itemId = (string) Str::uuid();
        $sourceName = trim((string) ($entry['file'] ?? ''));

        $item = AdminBookImportItem::query()->create([
            'batch_id' => $batch->id,
            'item_id' => $itemId,
            'created_by' => $administrator->id,
            'source_checksum_sha256' => str_repeat('0', 64),
            'source_file_name' => basename($sourceName ?: 'livre.pdf'),
            'source_file_size_bytes' => 0,
            'source_storage_path' => '',
            'cover_storage_path' => '',
            'status' => 'processing',
            'attempt_count' => 1,
            'rights_confirmed' => false,
        ]);

        $bookPath = null;
        $coverPath = null;

        try {
            $sourceName = $this->validatedZipEntry($sourceName, 'books/', ['pdf', 'epub']);
            $extension = mb_strtolower(pathinfo($sourceName, PATHINFO_EXTENSION));
            $bookStream = $zip->getStream($sourceName);

            if ($bookStream === false) {
                throw new RuntimeException("Le fichier {$sourceName} est introuvable dans le ZIP.");
            }

            $bookPath = 'catalog/imports/'.$batch->id.'/'.$itemId.'.'.$extension;

            try {
                Storage::disk('books')->put($bookPath, $bookStream);
            } finally {
                fclose($bookStream);
            }

            $this->validateBookFile($bookPath);
            $checksum = $this->checksum($bookPath);
            $duplicateOf = Book::query()
                ->where('admin_import_checksum', $checksum)
                ->value('id');

            $coverEntry = trim((string) ($entry['cover'] ?? ''));

            if ($coverEntry !== '') {
                $coverEntry = $this->validatedZipEntry(
                    $coverEntry,
                    'covers/',
                    ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'],
                );
                $coverStream = $zip->getStream($coverEntry);

                if ($coverStream !== false) {
                    $coverExtension = mb_strtolower(pathinfo($coverEntry, PATHINFO_EXTENSION));
                    $coverPath = 'covers/imports/'.$batch->id.'/'.$itemId.'.'.$coverExtension;

                    try {
                        Storage::disk('public')->put($coverPath, $coverStream, 'public');
                    } finally {
                        fclose($coverStream);
                    }
                }
            }

            $title = trim((string) ($entry['title'] ?? ''));

            if ($title === '') {
                $title = $this->titleFromFileName(basename($sourceName));
            }

            $authorName = trim((string) ($entry['author'] ?? ''));
            $authorCredit = trim((string) ($entry['author_credit'] ?? $authorName));
            $authorshipType = $this->normalizedAuthorshipType(
                (string) ($entry['authorship_type'] ?? ''),
                $authorName !== '',
            );

            $author = null;

            if ($authorName !== '') {
                $author = AuthorProfile::query()->firstOrCreate(
                    ['display_name' => mb_substr($authorName, 0, 255)],
                    [
                        'catalog_origin' => 'admin_import',
                        'rights_status' => 'unknown',
                        'is_reference_profile' => false,
                        'rights_notes' => 'Auteur créé automatiquement depuis un import administrateur.',
                        'social_links' => [],
                        'genres' => [],
                        'press_mentions' => [],
                    ],
                );
            }

            $categories = array_values(array_filter(
                is_array($entry['categories'] ?? null) ? $entry['categories'] : [],
                fn (mixed $value): bool => is_string($value) && trim($value) !== '',
            ));

            $publicationDate = $entry['publication_date'] ?? null;

            if (blank($publicationDate) && is_numeric($entry['publication_year_detected'] ?? null)) {
                $year = (int) $entry['publication_year_detected'];

                if ($year >= 1000 && $year <= 9999) {
                    $publicationDate = sprintf('%04d-01-01', $year);
                }
            }

            $book = DB::transaction(function () use (
                $entry,
                $title,
                $author,
                $authorCredit,
                $authorshipType,
                $bookPath,
                $coverPath,
                $checksum,
                $duplicateOf,
                $batch,
                $item,
                $administrator,
                $categories,
                $publicationDate,
                $extension,
            ): Book {
                $book = Book::query()->create([
                    'title' => mb_substr($title ?: 'Livre importé', 0, 255),
                    'subtitle' => filled($entry['subtitle'] ?? null) ? mb_substr((string) $entry['subtitle'], 0, 255) : null,
                    'description' => filled($entry['description'] ?? null) ? (string) $entry['description'] : null,
                    'price' => is_numeric($entry['price'] ?? null) ? max(0, (float) $entry['price']) : 0,
                    'currency_code' => filled($entry['currency_code'] ?? null) ? mb_substr((string) $entry['currency_code'], 0, 3) : 'USD',
                    'is_single_sale_enabled' => true,
                    'is_subscription_available' => false,
                    'author_id' => $author?->id,
                    'authorship_type' => $authorshipType,
                    'author_credit' => $authorCredit !== '' ? mb_substr($authorCredit, 0, 255) : null,
                    'author_display_name' => $author?->display_name ?: ($authorCredit !== '' ? mb_substr($authorCredit, 0, 255) : null),
                    'cover_url' => $coverPath,
                    'cover_thumbnail_url' => $coverPath,
                    'cover_source' => $coverPath ? 'import' : null,
                    'cover_alt_text' => 'Couverture de '.mb_substr($title ?: 'Livre importé', 0, 180),
                    'file_url' => $bookPath,
                    'file_format' => $extension,
                    'file_size' => Storage::disk('books')->size($bookPath),
                    'page_count' => is_numeric($entry['page_count'] ?? null) ? max(1, (int) $entry['page_count']) : null,
                    'isbn' => filled($entry['isbn'] ?? null) ? mb_substr((string) $entry['isbn'], 0, 50) : null,
                    'language' => filled($entry['language'] ?? null) ? mb_substr((string) $entry['language'], 0, 10) : 'fr',
                    'publisher' => filled($entry['publisher'] ?? null) ? mb_substr((string) $entry['publisher'], 0, 255) : 'Holistique Books',
                    'edition' => filled($entry['edition'] ?? null) ? mb_substr((string) $entry['edition'], 0, 255) : null,
                    'publication_date' => $publicationDate,
                    'editorial_pole' => $this->normalizedEditorialPole((string) ($entry['editorial_pole'] ?? 'general')),
                    'work_type' => $this->normalizedWorkType((string) ($entry['work_type'] ?? 'book')),
                    'editorial_stage' => 'intake',
                    'spiritual_metadata' => is_array($entry['spiritual_metadata'] ?? null) ? $entry['spiritual_metadata'] : null,
                    'ingestion_metadata' => [
                        'source' => 'prepared_archive',
                        'source_file' => basename((string) $entry['file']),
                        'duplicate_of' => $duplicateOf,
                    ],
                    'status' => 'draft',
                    'review_status' => 'draft',
                    'copyright_status' => 'review',
                    'copyright_note' => 'Import administrateur : droits à vérifier avant publication.',
                    'co_authors' => is_array($entry['co_authors'] ?? null) ? $entry['co_authors'] : [],
                    'categories' => $categories,
                    'tags' => is_array($entry['tags'] ?? null) ? $entry['tags'] : [],
                ]);

                $book->forceFill([
                    'admin_import_batch_id' => $batch->id,
                    'admin_import_item_id' => $item->id,
                    'admin_import_checksum' => $checksum,
                    'admin_import_original_file_name' => basename((string) $entry['file']),
                    'admin_imported_by' => $administrator->id,
                    'admin_imported_at' => now(),
                ])->saveQuietly();

                return $book;
            });

            $this->taxonomy->sync($book, $book->categories ?? []);
            $book = $this->metadata->enrich($book);

            $item->update([
                'source_checksum_sha256' => $checksum,
                'source_file_name' => basename($sourceName),
                'source_file_size_bytes' => Storage::disk('books')->size($bookPath),
                'source_storage_path' => $bookPath,
                'cover_storage_path' => $book->cover_url ?? '',
                'status' => 'completed',
                'book_id' => $book->id,
                'completed_at' => now(),
            ]);

            $book->editorialEvents()->create([
                'actor_id' => $administrator->id,
                'event_type' => 'imported',
                'to_stage' => 'intake',
                'notes' => 'Livre importé dans le catalogue administrateur.',
                'payload' => [
                    'batch_id' => $batch->id,
                    'duplicate_of' => $duplicateOf,
                ],
            ]);

            $batch->increment('completed_items');
        } catch (Throwable $exception) {
            if ($bookPath && Storage::disk('books')->exists($bookPath)) {
                Storage::disk('books')->delete($bookPath);
            }

            if ($coverPath && Storage::disk('public')->exists($coverPath)) {
                Storage::disk('public')->delete($coverPath);
            }

            $item->update([
                'status' => 'failed',
                'error_message' => Str::limit($exception->getMessage(), 1000),
                'completed_at' => now(),
            ]);

            $batch->increment('failed_items');
        }
    }

    private function importItem(
        AdminBookImportBatch $batch,
        string $path,
        ?AuthorProfile $author,
        Profile $administrator,
        bool $rightsConfirmed,
    ): void {
        $itemId = (string) Str::uuid();
        $fileName = basename($path);

        $item = AdminBookImportItem::query()->create([
            'batch_id' => $batch->id,
            'item_id' => $itemId,
            'created_by' => $administrator->id,
            'source_checksum_sha256' => str_repeat('0', 64),
            'source_file_name' => $fileName,
            'source_file_size_bytes' => 0,
            'source_storage_path' => $path,
            'cover_storage_path' => '',
            'status' => 'processing',
            'attempt_count' => 1,
            'rights_confirmed' => $rightsConfirmed,
        ]);

        try {
            $this->validateBookFile($path);
            $checksum = $this->checksum($path);
            $duplicateOf = Book::query()->where('admin_import_checksum', $checksum)->value('id');
            $extension = mb_strtolower(pathinfo($path, PATHINFO_EXTENSION));

            $book = DB::transaction(function () use (
                $path,
                $fileName,
                $checksum,
                $duplicateOf,
                $batch,
                $item,
                $author,
                $administrator,
                $rightsConfirmed,
                $extension,
            ): Book {
                $book = Book::query()->create([
                    'title' => $this->titleFromFileName($fileName),
                    'description' => null,
                    'price' => 0,
                    'currency_code' => 'USD',
                    'is_single_sale_enabled' => true,
                    'is_subscription_available' => false,
                    'author_id' => $author?->id,
                    'authorship_type' => $author ? 'named' : 'anonymous',
                    'author_credit' => $author?->display_name,
                    'author_display_name' => $author?->display_name,
                    'file_url' => $path,
                    'file_format' => $extension,
                    'file_size' => Storage::disk('books')->size($path),
                    'editorial_pole' => 'general',
                    'work_type' => 'book',
                    'editorial_stage' => 'intake',
                    'ingestion_metadata' => [
                        'source' => 'multi_file_import',
                        'source_file' => $fileName,
                        'duplicate_of' => $duplicateOf,
                    ],
                    'status' => 'draft',
                    'review_status' => 'draft',
                    'copyright_status' => $rightsConfirmed ? 'clear' : 'review',
                    'copyright_note' => $rightsConfirmed
                        ? 'Droits confirmés par un administrateur lors de l’import.'
                        : 'Droits à vérifier avant publication.',
                    'co_authors' => [],
                    'categories' => [],
                    'tags' => [],
                ]);

                $book->forceFill([
                    'admin_import_batch_id' => $batch->id,
                    'admin_import_item_id' => $item->id,
                    'admin_import_checksum' => $checksum,
                    'admin_import_original_file_name' => $fileName,
                    'admin_imported_by' => $administrator->id,
                    'admin_imported_at' => now(),
                ])->saveQuietly();

                return $book;
            });

            $book = $this->metadata->enrich($book);

            $item->update([
                'source_checksum_sha256' => $checksum,
                'source_file_size_bytes' => Storage::disk('books')->size($path),
                'cover_storage_path' => $book->cover_url ?? '',
                'status' => 'completed',
                'book_id' => $book->id,
                'completed_at' => now(),
            ]);

            $book->editorialEvents()->create([
                'actor_id' => $administrator->id,
                'event_type' => 'imported',
                'to_stage' => 'intake',
                'notes' => 'Livre importé via l’import rapide administrateur.',
                'payload' => ['batch_id' => $batch->id, 'duplicate_of' => $duplicateOf],
            ]);

            $batch->increment('completed_items');
        } catch (Throwable $exception) {
            $item->update([
                'status' => 'failed',
                'error_message' => Str::limit($exception->getMessage(), 1000),
                'completed_at' => now(),
            ]);
            $batch->increment('failed_items');
        }
    }

    /**
     * @param array<int, string> $extensions
     */
    private function validatedZipEntry(string $entry, string $prefix, array $extensions): string
    {
        $entry = str_replace('\\', '/', trim($entry));

        if (
            $entry === ''
            || str_starts_with($entry, '/')
            || str_contains($entry, '../')
            || ! str_starts_with($entry, $prefix)
        ) {
            throw new RuntimeException('Chemin de fichier invalide dans le lot.');
        }

        $extension = mb_strtolower(pathinfo($entry, PATHINFO_EXTENSION));

        if (! in_array($extension, $extensions, true)) {
            throw new RuntimeException('Type de fichier non autorisé dans le lot.');
        }

        return $entry;
    }

    private function validateBookFile(string $path): void
    {
        $disk = Storage::disk('books');

        if (! $disk->exists($path)) {
            throw new RuntimeException('Le fichier importé est introuvable.');
        }

        $extension = mb_strtolower(pathinfo($path, PATHINFO_EXTENSION));

        if (! in_array($extension, ['pdf', 'epub'], true)) {
            throw new RuntimeException('Les imports multiples acceptent les fichiers PDF, EPUB, MOBI et AZW3.');
        }

        $size = $disk->size($path);

        if ($size <= 0) {
            throw new RuntimeException('Le fichier importé est vide.');
        }

        if ($size > 450 * 1024 * 1024) {
            throw new RuntimeException('Le fichier dépasse la limite de 450 Mo.');
        }

        if ($extension !== 'pdf') {
            return;
        }

        $stream = $disk->readStream($path);

        if ($stream === false) {
            throw new RuntimeException('Le fichier PDF ne peut pas être lu.');
        }

        try {
            $signature = fread($stream, 5);
        } finally {
            fclose($stream);
        }

        if ($signature !== '%PDF-') {
            throw new RuntimeException('Le contenu du fichier n’est pas un PDF valide.');
        }
    }

    private function checksum(string $path): string
    {
        $stream = Storage::disk('books')->readStream($path);

        if ($stream === false) {
            throw new RuntimeException('Impossible de calculer l’empreinte du fichier.');
        }

        $context = hash_init('sha256');

        try {
            hash_update_stream($context, $stream);
        } finally {
            fclose($stream);
        }

        return hash_final($context);
    }

    private function normalizedAuthorshipType(string $value, bool $hasAuthor): string
    {
        $value = trim($value);

        if (in_array($value, ['named', 'collective', 'institutional', 'anonymous', 'traditional', 'sacred_text'], true)) {
            return $value;
        }

        return $hasAuthor ? 'named' : 'anonymous';
    }

    private function normalizedEditorialPole(string $value): string
    {
        return in_array($value, ['general', 'ecclesial', 'institutional', 'entrepreneurial'], true)
            ? $value
            : 'general';
    }

    private function normalizedWorkType(string $value): string
    {
        $allowed = [
            'book', 'bible', 'theology', 'devotional', 'sermon', 'prayer', 'hymnal', 'study_guide',
            'academic', 'manual', 'essay', 'novel', 'biography', 'magazine', 'report', 'other',
        ];

        return in_array($value, $allowed, true) ? $value : 'book';
    }

    private function titleFromFileName(string $fileName): string
    {
        $name = pathinfo($fileName, PATHINFO_FILENAME);
        $name = Str::contains($name, '--') ? Str::after($name, '--') : $name;
        $title = Str::of($name)->replace(['-', '_'], ' ')->squish()->title()->toString();

        return $title !== '' ? $title : 'Livre importé';
    }

    private function createBatch(Profile $administrator, int $count): AdminBookImportBatch
    {
        return AdminBookImportBatch::query()->create([
            'created_by' => $administrator->id,
            'status' => 'processing',
            'total_items' => $count,
            'completed_items' => 0,
            'failed_items' => 0,
        ]);
    }

    private function completeBatch(AdminBookImportBatch $batch): AdminBookImportBatch
    {
        $batch->refresh();

        $batch->update([
            'status' => match (true) {
                $batch->failed_items === 0 => 'completed',
                $batch->completed_items === 0 => 'failed',
                default => 'partial',
            },
            'completed_at' => now(),
        ]);

        return $batch->refresh();
    }
}
