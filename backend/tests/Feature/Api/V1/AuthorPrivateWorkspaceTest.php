<?php

namespace Tests\Feature\Api\V1;

use App\Models\AuthorProfile;
use App\Models\Book;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthorPrivateWorkspaceTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_author_can_read_their_private_writing_workspace(): void
    {
        [$user, $profile] = $this->author();

        $book = Book::factory()->draft()->create([
            'author_id' => $profile->id,
            'writing_status' => 'writing',
            'target_word_count' => 60000,
            'current_word_count' => 17500,
            'next_author_action' => 'Terminer le chapitre 7.',
            'author_private_notes' => 'Notes strictement privées.',
        ]);

        Sanctum::actingAs($user);

        $this->getJson("/api/v1/author/books/{$book->id}")
            ->assertOk()
            ->assertJsonPath('data.author_workspace.writing_status', 'writing')
            ->assertJsonPath('data.author_workspace.target_word_count', 60000)
            ->assertJsonPath('data.author_workspace.current_word_count', 17500)
            ->assertJsonPath('data.author_workspace.next_author_action', 'Terminer le chapitre 7.')
            ->assertJsonPath('data.author_workspace.author_private_notes', 'Notes strictement privées.');
    }

    public function test_author_cannot_read_another_authors_private_workspace(): void
    {
        [, $ownerProfile] = $this->author();
        [$intruder] = $this->author();

        $book = Book::factory()->draft()->create([
            'author_id' => $ownerProfile->id,
            'author_private_notes' => 'Secret éditorial.',
        ]);

        Sanctum::actingAs($intruder);

        $this->getJson("/api/v1/author/books/{$book->id}")
            ->assertNotFound();
    }

    public function test_public_book_resource_never_exposes_author_private_workspace_fields(): void
    {
        [, $profile] = $this->author();

        $book = Book::factory()->create([
            'author_id' => $profile->id,
            'status' => 'published',
            'copyright_status' => 'clear',
            'author_private_notes' => 'Ne doit jamais sortir.',
            'next_author_action' => 'Privé.',
        ]);

        $response = $this->getJson("/api/v1/books/{$book->id}")
            ->assertOk();

        $this->assertArrayNotHasKey('author_workspace', $response->json('data'));
        $this->assertArrayNotHasKey('author_private_notes', $response->json('data'));
        $this->assertArrayNotHasKey('next_author_action', $response->json('data'));
    }

    /**
     * @return array{0: User, 1: Profile}
     */
    private function author(): array
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $profile = Profile::factory()->author()->create([
            'id' => $user->id,
            'email' => $user->email,
        ]);

        AuthorProfile::query()->create([
            'id' => $profile->id,
            'display_name' => $profile->name,
            'social_links' => [],
            'genres' => [],
            'press_mentions' => [],
        ]);

        return [$user, $profile];
    }
}
