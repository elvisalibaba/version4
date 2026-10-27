<?php

namespace Tests\Feature\Api\V1;

use App\Models\Book;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompactBookCatalogueTest extends TestCase
{
    use RefreshDatabase;

    public function test_card_view_returns_minimal_public_data_without_changing_the_full_api(): void
    {
        $book = Book::factory()->free()->create(['title' => 'Lecture légère']);
        $compact = $this->getJson('/api/v1/books?view=card');

        $compact->assertOk()
            ->assertJsonPath('data.0.id', $book->id)
            ->assertJsonPath('data.0.title', 'Lecture légère')
            ->assertJsonPath('data.0.is_free', true)
            ->assertJsonMissingPath('data.0.copyright_note')
            ->assertJsonMissingPath('data.0.review_note');

        $this->getJson('/api/v1/books')
            ->assertOk()
            ->assertJsonPath('data.0.id', $book->id)
            ->assertJsonStructure(['data' => [['description', 'copyright_status']]]);
    }
}
