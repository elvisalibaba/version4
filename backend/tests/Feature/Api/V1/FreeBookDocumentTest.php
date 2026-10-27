<?php

namespace Tests\Feature\Api\V1;

use App\Models\Book;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class FreeBookDocumentTest extends TestCase
{
    use RefreshDatabase;

    public function test_anonymous_visitor_can_read_all_pages_of_a_published_free_pdf(): void
    {
        Storage::fake('books');
        $book = Book::factory()->free()->create([
            'file_url' => 'free-title.pdf',
            'file_format' => 'pdf',
            'page_count' => 120,
        ]);
        Storage::disk('books')->put('free-title.pdf', '%PDF-1.4 test');

        $response = $this->get("/api/v1/books/{$book->id}/read-free");

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/pdf');
        $response->assertHeader('X-Holistique-Free-Reader', '1');
        $this->assertStringContainsString('%PDF-1.4', $response->streamedContent());
        $this->assertDatabaseMissing('libraries', ['book_id' => $book->id]);
    }

    public function test_paid_books_do_not_expose_their_full_source(): void
    {
        Storage::fake('books');
        $book = Book::factory()->create(['file_url' => 'paid-title.pdf', 'file_format' => 'pdf']);
        Storage::disk('books')->put('paid-title.pdf', '%PDF-1.4 paid');

        $this->get("/api/v1/books/{$book->id}/read-free")->assertForbidden();
    }

    public function test_unpublished_or_license_restricted_free_books_are_denied(): void
    {
        $draft = Book::factory()->free()->draft()->create();
        $restricted = Book::factory()->free()->create(['can_read_on_platform' => false]);
        $previewOnly = Book::factory()->free()->create(['reading_access_mode' => 'preview_only']);

        foreach ([$draft, $restricted, $previewOnly] as $book) {
            $this->get("/api/v1/books/{$book->id}/read-free")->assertForbidden();
        }
    }
}
