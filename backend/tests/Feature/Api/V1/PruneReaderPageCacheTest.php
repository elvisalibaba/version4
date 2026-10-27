<?php

namespace Tests\Feature\Api\V1;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PruneReaderPageCacheTest extends TestCase
{
    public function test_pruning_only_old_jpegs_in_reader_cache(): void
    {
        Storage::fake('local');
        $disk = Storage::disk('local');
        $old = 'reader-pages/book-1/hash/full-1.jpg';
        $new = 'reader-pages/book-1/hash/full-2.jpg';
        $privateBook = 'books/important-original.pdf';

        $disk->put($old, 'old image');
        $disk->put($new, 'new image');
        $disk->put($privateBook, '%PDF-1.4');
        touch($disk->path($old), now()->subDays(10)->timestamp);

        $this->assertSame(0, Artisan::call('reader-cache:prune', ['--days' => 7, '--limit' => 1]));
        $disk->assertMissing($old);
        $disk->assertExists($new);
        $disk->assertExists($privateBook);
    }
}
