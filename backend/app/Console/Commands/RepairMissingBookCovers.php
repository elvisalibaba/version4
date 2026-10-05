<?php

namespace App\Console\Commands;

use App\Models\Book;
use App\Services\BookDocumentMetadataService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Throwable;

class RepairMissingBookCovers extends Command
{
    protected $signature = 'books:repair-covers {--all : Recheck all books, including records with an existing cover path}';

    protected $description = 'Generate or repair missing book covers from PDF first pages, with a branded fallback cover.';

    public function handle(BookDocumentMetadataService $metadata): int
    {
        $query = Book::query()->orderBy('created_at');

        if (! $this->option('all')) {
            $query->where(function ($query): void {
                $query->whereNull('cover_url')->orWhere('cover_url', '');
            });
        }

        $processed = 0;
        $repaired = 0;
        $failed = 0;

        foreach ($query->cursor() as $book) {
            $processed++;

            try {
                if ($this->option('all') && filled($book->cover_url)) {
                    $cover = (string) $book->cover_url;
                    $isExternal = str_starts_with($cover, 'http://') || str_starts_with($cover, 'https://');

                    if ($isExternal || Storage::disk('public')->exists(ltrim($cover, '/'))) {
                        continue;
                    }

                    $book->forceFill([
                        'cover_url' => null,
                        'cover_thumbnail_url' => null,
                        'cover_source' => null,
                    ])->saveQuietly();
                }

                $book = $metadata->enrich($book);

                if (filled($book->cover_url)) {
                    $repaired++;
                    $this->line("✓ {$book->title}");
                } else {
                    $failed++;
                    $this->warn("✗ {$book->title}");
                }
            } catch (Throwable $exception) {
                $failed++;
                $this->error("✗ {$book->title}: {$exception->getMessage()}");
            }
        }

        $this->newLine();
        $this->info("Terminée : {$processed} vérifié(s), {$repaired} couverture(s) générée(s), {$failed} échec(s).");

        return $failed === 0 ? self::SUCCESS : self::FAILURE;
    }
}
