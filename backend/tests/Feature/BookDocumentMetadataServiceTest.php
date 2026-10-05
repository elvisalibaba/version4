<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Services\BookDocumentMetadataService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BookDocumentMetadataServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_book_without_file_or_cover_receives_a_branded_fallback_cover(): void
    {
        Storage::fake('public');

        $book = Book::factory()->draft()->create([
            'title' => 'Ouvrage sans couverture',
            'cover_url' => null,
            'cover_thumbnail_url' => null,
            'file_url' => null,
        ]);

        $book = app(BookDocumentMetadataService::class)->enrich($book);

        $this->assertSame('generated_placeholder', $book->cover_source);
        $this->assertNotNull($book->cover_url);
        $this->assertSame($book->cover_url, $book->cover_thumbnail_url);
        Storage::disk('public')->assertExists($book->cover_url);
    }

    public function test_manual_cover_is_preserved_and_marked_as_upload(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('covers/manual.webp', 'cover');

        $book = Book::factory()->draft()->create([
            'title' => 'Ouvrage avec couverture',
            'cover_url' => 'covers/manual.webp',
            'cover_thumbnail_url' => null,
            'cover_source' => null,
        ]);

        $book = app(BookDocumentMetadataService::class)->enrich($book);

        $this->assertSame('covers/manual.webp', $book->cover_url);
        $this->assertSame('covers/manual.webp', $book->cover_thumbnail_url);
        $this->assertSame('upload', $book->cover_source);
    }
}
