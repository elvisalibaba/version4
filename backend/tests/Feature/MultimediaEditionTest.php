<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\MediaEdition;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class MultimediaEditionTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_published_audio_edition_is_exposed_with_book_api(): void
    {
        $book = Book::factory()->create([
            'status' => 'published',
            'copyright_status' => 'clear',
        ]);

        MediaEdition::query()->create([
            'book_id' => $book->id,
            'media_type' => 'audiobook',
            'title' => 'Édition audio',
            'language' => 'fr',
            'duration_seconds' => 3600,
            'narrator' => 'Narrateur Test',
            'status' => 'published',
            'published_at' => now(),
        ]);

        $this->getJson("/api/v1/books/{$book->id}")
            ->assertOk()
            ->assertJsonPath('data.media_editions.0.media_type', 'audiobook')
            ->assertJsonPath('data.media_editions.0.narrator', 'Narrateur Test');
    }
}
