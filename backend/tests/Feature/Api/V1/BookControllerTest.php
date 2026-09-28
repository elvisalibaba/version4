<?php

namespace Tests\Feature\Api\V1;

use App\Models\AuthorProfile;
use App\Models\Book;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BookControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_public_index_returns_only_available_books(): void
    {
        $published = Book::factory()->create(['title' => 'Livre visible']);
        Book::factory()->draft()->create(['title' => 'Brouillon secret']);

        $this->getJson('/api/v1/books')
            ->assertOk()
            ->assertJsonFragment(['id' => $published->id, 'title' => 'Livre visible'])
            ->assertJsonMissing(['title' => 'Brouillon secret']);
    }

    public function test_reader_cannot_create_a_book(): void
    {
        $user = $this->createUserWithProfile('reader');
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/books', ['title' => 'Interdit', 'price' => 0])
            ->assertForbidden();

        $this->assertDatabaseMissing('books', ['title' => 'Interdit']);
    }

    public function test_author_can_create_a_draft_book(): void
    {
        $user = $this->createUserWithProfile('author');
        AuthorProfile::factory()->create(['id' => $user->id]);
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/books', [
            'title' => 'Nouveau manuscrit',
            'price' => 12,
            'status' => 'published',
        ])->assertCreated()->assertJsonPath('data.status', 'draft');

        $this->assertDatabaseHas('books', ['title' => 'Nouveau manuscrit', 'author_id' => $user->id, 'status' => 'draft']);
    }

    private function createUserWithProfile(string $role): User
    {
        $user = User::factory()->create();
        Profile::factory()->create(['id' => $user->id, 'email' => $user->email, 'role' => $role]);

        return $user;
    }
}
