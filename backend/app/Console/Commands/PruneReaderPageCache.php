<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use FilesystemIterator;

class PruneReaderPageCache extends Command
{
    protected $signature = 'reader-cache:prune {--days=7 : Age minimum du cache (en jours)} {--limit=500 : Maximum de pages supprimées par passage}';
    protected $description = 'Nettoie progressivement les JPEG du lecteur sans toucher aux livres originaux.';

    public function handle(): int
    {
        $days = max(1, (int) $this->option('days'));
        $limit = max(1, min(2000, (int) $this->option('limit')));
        $olderThan = now()->subDays($days)->timestamp;

        // A lazy filesystem iterator is essential for small cPanel RAM limits:
        // Storage::allFiles() would eagerly allocate all cached image names.
        $disk = Storage::disk('local');
        $root = $disk->path('reader-pages');
        if (! is_dir($root)) {
            $this->info('Aucune page en cache à nettoyer.');

            return self::SUCCESS;
        }

        $files = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS),
            RecursiveIteratorIterator::LEAVES_ONLY,
        );
        $deleted = 0;

        foreach ($files as $file) {
            if ($deleted >= $limit) {
                break;
            }
            if (! $file->isFile() || strtolower($file->getExtension()) !== 'jpg') {
                continue;
            }
            if ($file->getMTime() >= $olderThan) {
                continue;
            }

            // Never delete outside storage/app/private/reader-pages.
            $relative = substr($file->getPathname(), strlen($root) + 1);
            $relative = str_replace(DIRECTORY_SEPARATOR, '/', $relative);
            if ($relative !== '' && $disk->delete('reader-pages/'.$relative)) {
                $deleted++;
            }
        }

        $this->info("Pages JPEG périmées supprimées : {$deleted}. Originaux conservés.");

        return self::SUCCESS;
    }
}
