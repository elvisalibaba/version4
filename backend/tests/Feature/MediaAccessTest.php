<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\Library;
use App\Models\MediaEdition;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MediaAccessTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_reader_with_library_access_receives_playback_contract(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $profile = Profile::factory()->create([
            'id' => $user->id,
            'email' => $user->email,
            'role' => 'reader',
        ]);
        $book = Book::factory()->create(['status' => 'published', 'copyright_status' => 'clear']);
        Library::factory()->create([
            'user_id' => $profile->id,
            'book_id' => $book->id,
            'access_type' => 'purchase',
            'status' => 'active',
        ]);
        $edition = MediaEdition::query()->create([
            'book_id' => $book->id,
            'media_type' => 'audiobook',
            'title' => 'Audio',
            'language' => 'fr',
            'streaming_url' => 'https://media.example.org/audio/test.m3u8',
            'status' => 'published',
            'published_at' => now(),
        ]);

        Sanctum::actingAs($user);

        $this->getJson("/api/v1/media-editions/{$edition->id}/access")
            ->assertOk()
            ->assertJsonPath('data.media_type', 'audiobook')
            ->assertJsonPath('data.playback_url', 'https://media.example.org/audio/test.m3u8');
    }

    public function test_reader_without_entitlement_cannot_access_media(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        Profile::factory()->create([
            'id' => $user->id,
            'email' => $user->email,
            'role' => 'reader',
        ]);
        $book = Book::factory()->create(['status' => 'published', 'copyright_status' => 'clear']);
        $edition = MediaEdition::query()->create([
            'book_id' => $book->id,
            'media_type' => 'video',
            'title' => 'Vidéo',
            'language' => 'fr',
            'streaming_url' => 'https://media.example.org/video/test.m3u8',
            'status' => 'published',
            'published_at' => now(),
        ]);

        Sanctum::actingAs($user);

        $this->getJson("/api/v1/media-editions/{$edition->id}/access")->assertForbidden();
    }
}
