<?php

namespace Tests\Feature;

use App\Models\AuthorProfile;
use App\Models\Book;
use App\Models\RightsContract;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class PublishingRightsTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_editorial_taxonomy_and_reference_authors_are_preloaded(): void
    {
        $this->assertDatabaseHas('categories', ['slug' => 'finance-investissement', 'is_active' => 1]);
        $this->assertDatabaseHas('categories', ['slug' => 'litterature-africaine', 'is_featured' => 1]);
        $this->assertDatabaseHas('author_profiles', [
            'display_name' => 'Robert Kiyosaki',
            'catalog_origin' => 'international_reference',
            'rights_status' => 'not_acquired',
            'is_reference_profile' => 1,
        ]);
    }

    public function test_reference_author_is_hidden_from_public_author_directory_without_licensed_public_title(): void
    {
        $author = AuthorProfile::query()->where('display_name', 'Robert Kiyosaki')->firstOrFail();

        $this->getJson('/api/v1/authors')
            ->assertOk()
            ->assertJsonMissing(['id' => $author->id]);

        $this->getJson("/api/v1/authors/{$author->id}")
            ->assertNotFound();
    }

    public function test_reference_author_title_cannot_publish_without_active_rights(): void
    {
        $author = AuthorProfile::query()->where('display_name', 'Robert Kiyosaki')->firstOrFail();

        $book = Book::factory()->draft()->create([
            'author_id' => $author->id,
            'author_display_name' => $author->display_name,
            'copyright_status' => 'review',
        ]);

        try {
            $book->update(['status' => 'published', 'copyright_status' => 'clear']);
            $this->fail('A reference title should not publish without rights.');
        } catch (ValidationException) {
            $this->assertTrue(true);
        }

        RightsContract::query()->create([
            'book_id' => $book->id,
            'rights_holder_name' => 'Rights Holder',
            'status' => 'active',
            'territories' => ['CD'],
            'languages' => ['fr'],
            'permitted_media' => ['ebook'],
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addYear(),
        ]);

        $book->update(['status' => 'published', 'copyright_status' => 'clear']);
        $this->assertSame('published', $book->fresh()->status);
    }
}
