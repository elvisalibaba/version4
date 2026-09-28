<?php

namespace Tests\Feature\Api\V1;

use App\Models\Book;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FavoriteControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_unauthenticated_request_returns_401(): void
    {
        $book = Book::factory()->create();

        $this->postJson("/api/v1/favorites/{$book->id}")->assertUnauthorized();
    }

    public function test_reader_can_add_and_remove_a_favorite(): void
    {
        $user = User::factory()->create();
        Profile::factory()->create(['id' => $user->id, 'email' => $user->email]);
        $book = Book::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson("/api/v1/favorites/{$book->id}")->assertCreated();
        $this->assertDatabaseHas('book_favorites', ['user_id' => $user->id, 'book_id' => $book->id]);

        $this->deleteJson("/api/v1/favorites/{$book->id}")->assertNoContent();
        $this->assertDatabaseMissing('book_favorites', ['user_id' => $user->id, 'book_id' => $book->id]);
    }
}
