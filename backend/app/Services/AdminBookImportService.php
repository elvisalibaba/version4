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
    public function __construct(private BookDocumentMetadataService $metadata) {}

    /**
     * @param  array<int, string>  $paths
     */
    public function import(array $paths, AuthorProfile $author, Profile $administrator, bool $rightsConfirmed): AdminBookImportBatch
    {
        if ($administrator->role !== 'admin') {
            throw new InvalidArgumentException('Seul un administrateur peut importer plusieurs livres.');
        }

        if (! $rightsConfirmed) {
            throw new InvalidArgumentException('La confirmation des droits est obligatoire.');
        }

        $paths = array_values(array_unique(array_filter($paths, fn (mixed $path): bool => is_string($path) && $path !== '')));

        if ($paths === [] || count($paths) > 10) {
            throw new InvalidArgumentException('Un lot doit contenir entre 1 et 10 livres.');
        }

        $batch = AdminBookImportBatch::query()->create([
            'created_by' => $administrator->id,
            'status' => 'processing',
            'total_items' => count($paths),
            'completed_items' => 0,
            'failed_items' => 0,
        ]);

        foreach ($paths as $path) {
            $this->importItem($batch, $path, $author, $administrator);
        }

        $batch->refresh();
        $status = match (true) {
            $batch->failed_items === 0 => 'completed',
            $batch->completed_items === 0 => 'failed',
            default => 'partial',
        };

        $batch->update([
            'status' => $status,
            'completed_at' => now(),
        ]);

        return $batch->refresh();
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
            $manifestRaw = $zip->getFromName('manifest.json');

            if (! is_string($manifestRaw) || trim($manifestRaw) === '') {
                throw new RuntimeException('Le lot doit contenir un fichier manifest.json à la racine.');
            }

            $manifest = json_decode($manifestRaw, true, 512, JSON_THROW_ON_ERROR);
            $entries = $manifest['books'] ?? null;

            if (! is_array($entries) || count($entries) < 1 || count($entries) > 50) {
                throw new RuntimeException('Le manifeste doit contenir entre 1 et 50 livres.');
            }

            $batch = AdminBookImportBatch::query()->create([
                'created_by' => $administrator->id,
                'status' => 'processing',
                'total_items' => count($entries),
                'completed_items' => 0,
                'failed_items' => 0,
            ]);

            foreach ($entries as $entry) {
                $this->importPreparedItem($batch, $zip, is_array($entry) ? $entry : [], $administrator);
            }

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
        } finally {
            $zip->close();
        }
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
        $sourceName = (string) ($entry['file'] ?? '');

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
            $title = trim((string) ($entry['title'] ?? ''));
            $authorName = trim((string) ($entry['author'] ?? ''));

            if ($title === '' || $authorName === '') {
                throw new RuntimeException('Chaque livre doit avoir un titre et un auteur dans manifest.json.');
            }

            $sourceName = $this->validatedZipEntry($sourceName, 'books/', ['pdf']);
            $bookStream = $zip->getStream($sourceName);

            if ($bookStream === false) {
                throw new RuntimeException("Le PDF {$sourceName} est introuvable dans le ZIP.");
            }

            $bookPath = 'catalog/imports/'.$batch->id.'/'.$itemId.'.pdf';

            try {
                Storage::disk('books')->put($bookPath, $bookStream);
            } finally {
                fclose($bookStream);
            }

            $this->validatePdf($bookPath);
            $checksum = $this->checksum($bookPath);

            if (Book::query()->where('admin_import_checksum', $checksum)->exists()) {
                throw new RuntimeException('Ce fichier a déjà été importé.');
            }

            $coverEntry = trim((string) ($entry['cover'] ?? ''));

            if ($coverEntry !== '') {
                $coverEntry = $this->validatedZipEntry($coverEntry, 'covers/', ['jpg', 'jpeg', 'png', 'webp']);
                $coverStream = $zip->getStream($coverEntry);

                if ($coverStream === false) {
                    throw new RuntimeException("La couverture {$coverEntry} est introuvable dans le ZIP.");
                }

                $extension = mb_strtolower(pathinfo($coverEntry, PATHINFO_EXTENSION));
                $coverPath = 'covers/imports/'.$batch->id.'/'.$itemId.'.'.$extension;

                try {
                    Storage::disk('public')->put($coverPath, $coverStream);
                } finally {
                    fclose($coverStream);
                }
            }

            $author = AuthorProfile::query()->firstOrCreate(
                ['display_name' => mb_substr($authorName, 0, 255)],
                [
                    'catalog_origin' => 'admin_import',
                    'rights_status' => 'unknown',
                    'is_reference_profile' => false,
                    'rights_notes' => 'Auteur créé automatiquement depuis un lot préparé. Les droits sont gérés au niveau de chaque livre.',
                    'social_links' => [],
                    'genres' => [],
                    'press_mentions' => [],
                ],
            );

            $book = DB::transaction(function () use (
                $entry,
                $title,
                $author,
                $bookPath,
                $coverPath,
                $checksum,
                $batch,
                $item,
                $administrator,
            ): Book {
                $categories = array_values(array_filter(
                    is_array($entry['categories'] ?? null) ? $entry['categories'] : [],
                    fn (mixed $value): bool => is_string($value) && trim($value) !== '',
                ));

                $book = Book::query()->create([
                    'title' => mb_substr($title, 0, 255),
                    'subtitle' => filled($entry['subtitle'] ?? null) ? mb_substr((string) $entry['subtitle'], 0, 255) : null,
                    'description' => filled($entry['description'] ?? null) ? (string) $entry['description'] : null,
                    'price' => 0,
                    'currency_code' => 'USD',
                    'is_single_sale_enabled' => true,
                    'is_subscription_available' => false,
                    'author_id' => $author->id,
                    'author_display_name' => $author->display_name,
                    'cover_url' => $coverPath,
                    'cover_thumbnail_url' => $coverPath,
                    'cover_alt_text' => 'Couverture de '.mb_substr($title, 0, 180),
                    'file_url' => $bookPath,
                    'file_format' => 'pdf',
                    'file_size' => Storage::disk('books')->size($bookPath),
                    'page_count' => is_numeric($entry['page_count'] ?? null) ? (int) $entry['page_count'] : null,
                    'isbn' => filled($entry['isbn'] ?? null) ? mb_substr((string) $entry['isbn'], 0, 50) : null,
                    'language' => filled($entry['language'] ?? null) ? mb_substr((string) $entry['language'], 0, 10) : 'fr',
                    'publisher' => filled($entry['publisher'] ?? null) ? mb_substr((string) $entry['publisher'], 0, 255) : null,
                    'edition' => filled($entry['edition'] ?? null) ? mb_substr((string) $entry['edition'], 0, 255) : null,
                    'publication_date' => filled($entry['publication_date'] ?? null) ? $entry['publication_date'] : null,
                    'status' => 'draft',
                    'review_status' => 'draft',
                    'copyright_status' => 'review',
                    'copyright_note' => 'Import préparé : droits à vérifier avant publication.',
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
                ])->save();

                return $book;
            });

            $item->update([
                'source_checksum_sha256' => $checksum,
                'source_file_name' => basename($sourceName),
                'source_file_size_bytes' => Storage::disk('books')->size($bookPath),
                'source_storage_path' => $bookPath,
                'cover_storage_path' => $coverPath ?? '',
                'status' => 'completed',
                'book_id' => $book->id,
                'completed_at' => now(),
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
            throw new RuntimeException('Chemin de fichier invalide dans le manifeste.');
        }

        $extension = mb_strtolower(pathinfo($entry, PATHINFO_EXTENSION));

        if (! in_array($extension, $extensions, true)) {
            throw new RuntimeException('Type de fichier non autorisé dans le lot.');
        }

        return $entry;
    }

    private function importItem(AdminBookImportBatch $batch, string $path, AuthorProfile $author, Profile $administrator): void
    {
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
            'rights_confirmed' => true,
        ]);

        try {
            $this->validatePdf($path);
            $checksum = $this->checksum($path);

            if (Book::query()->where('admin_import_checksum', $checksum)->exists()) {
                throw new RuntimeException('Ce fichier a déjà été importé.');
            }

            $book = DB::transaction(function () use ($path, $fileName, $checksum, $batch, $item, $author, $administrator): Book {
                $book = Book::query()->create([
                    'title' => $this->titleFromFileName($fileName),
                    'description' => null,
                    'price' => 0,
                    'currency_code' => 'USD',
                    'is_single_sale_enabled' => true,
                    'is_subscription_available' => false,
                    'author_id' => $author->id,
                    'author_display_name' => $author->display_name,
                    'file_url' => $path,
                    'file_format' => 'pdf',
                    'file_size' => Storage::disk('books')->size($path),
                    'status' => 'draft',
                    'review_status' => 'draft',
                    'copyright_status' => 'review',
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
                ])->save();

                return $this->metadata->enrich($book);
            });

            $item->update([
                'source_checksum_sha256' => $checksum,
                'source_file_size_bytes' => Storage::disk('books')->size($path),
                'cover_storage_path' => $book->cover_url ?? '',
                'status' => 'completed',
                'book_id' => $book->id,
                'completed_at' => now(),
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

    private function validatePdf(string $path): void
    {
        $disk = Storage::disk('books');

        if (! $disk->exists($path)) {
            throw new RuntimeException('Le fichier importé est introuvable.');
        }

        if (mb_strtolower(pathinfo($path, PATHINFO_EXTENSION)) !== 'pdf') {
            throw new RuntimeException('Seuls les fichiers PDF sont acceptés pour l’import multiple.');
        }

        if ($disk->size($path) > 200 * 1024 * 1024) {
            throw new RuntimeException('Le fichier dépasse la limite de 200 Mo.');
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

    private function titleFromFileName(string $fileName): string
    {
        $name = pathinfo($fileName, PATHINFO_FILENAME);
        $name = Str::contains($name, '--') ? Str::after($name, '--') : $name;
        $title = Str::of($name)->replace(['-', '_'], ' ')->squish()->title()->toString();

        return $title !== '' ? $title : 'Livre importé';
    }
}
