<?php

namespace Tests\Feature;

use App\Models\Book;
use Tests\TestCase;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;

class PublicRightsVisibilityTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_published_book_under_rights_review_is_not_public(): void
    {
        $book = Book::factory()->create([
            'status' => 'published',
            'copyright_status' => 'review',
        ]);

        $this->getJson('/api/v1/books')
            ->assertOk()
            ->assertJsonMissing(['id' => $book->id]);

        $this->getJson("/api/v1/books/{$book->id}")
            ->assertForbidden();
    }

    public function test_published_book_with_clear_rights_is_public(): void
    {
        $book = Book::factory()->create([
            'status' => 'published',
            'copyright_status' => 'clear',
        ]);

        $this->getJson("/api/v1/books/{$book->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $book->id);
    }
}
