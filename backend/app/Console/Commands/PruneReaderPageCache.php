<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class PruneReaderPageCache extends Command
{
    protected $signature = 'reader-cache:prune {--days=7 : Minimum age of cached images} {--limit=500 : Maximum files deleted per run}';
    protected $description = 'Remove old rendered JPEG pages without touching original private books.';

    public function handle(): int
    {
        $days = max(1, (int) $this->option('days'));
        $limit = max(1, min(2000, (int) $this->option('limit')));
        $threshold = now()->subDays($days)->timestamp;
        $disk = Storage::disk('local');
        $deleted = 0;

        foreach ($disk->allFiles('reader-pages') as $path) {
            if ($deleted >= $limit) {
                break;
            }
            if (! str_ends_with($path, '.jpg')) {
                continue;
            }
            if ($disk->lastModified($path) >= $threshold) {
                continue;
            }
            if ($disk->delete($path)) {
                $deleted++;
            }
        }

        $this->info("Anciennes pages JPEG supprimées : {$deleted} (originaux conservés).");

        return self::SUCCESS;
    }
}
