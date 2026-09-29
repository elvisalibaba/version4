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
