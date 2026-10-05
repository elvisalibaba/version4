<?php

namespace Tests\Feature\Api\V1;

use App\Models\Book;
use App\Models\BookAsset;
use App\Models\Library;
use App\Models\Profile;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReadControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_unauthenticated_request_returns_401(): void
    {
        $book = Book::factory()->free()->create();

        $this->getJson("/api/v1/read/{$book->id}")->assertUnauthorized();
    }

    public function test_legacy_public_full_file_endpoint_is_gone(): void
    {
        $book = $this->createBookWithPrivateFile([
            'price' => 0,
            'status' => 'published',
            'copyright_status' => 'clear',
            'is_single_sale_enabled' => true,
        ], withSample: true);

        $this->getJson("/api/v1/books/{$book->id}/read-free")
            ->assertStatus(410)
            ->assertJsonPath(
                'message',
                'Le transfert public du fichier est désactivé. Utilisez l’aperçu protégé page par page.',
            );
    }

    public function test_legacy_authenticated_full_file_endpoint_is_gone(): void
    {
        [$user, $profile] = $this->createReader();
        $book = $this->createBookWithPrivateFile();
        Library::factory()->create(['user_id' => $profile->id, 'book_id' => $book->id]);
        Sanctum::actingAs($user);

        $this->getJson("/api/v1/read/{$book->id}")
            ->assertStatus(410)
            ->assertJsonPath(
                'message',
                'Le transfert du fichier complet est désactivé. Utilisez le lecteur protégé page par page.',
            );
    }

    public function test_protected_page_requires_a_reader_session(): void
    {
        [$user, $profile] = $this->createReader();
        $book = $this->createBookWithPrivateFile();
        Library::factory()->create(['user_id' => $profile->id, 'book_id' => $book->id]);
        Sanctum::actingAs($user);

        $this->getJson("/api/v1/read/{$book->id}/pages/1")
            ->assertUnauthorized()
            ->assertJsonPath('message', 'Session de lecture sécurisée requise.');
    }

    public function test_access_endpoint_issues_a_short_lived_reader_session(): void
    {
        [$user, $profile] = $this->createReader();
        $book = $this->createBookWithPrivateFile();
        Library::factory()->create(['user_id' => $profile->id, 'book_id' => $book->id]);
        Sanctum::actingAs($user);

        $response = $this->withHeader('X-Holistique-Reader', 'test')
            ->getJson("/api/v1/books/{$book->id}/access")
            ->assertOk()
            ->assertJsonPath('data.hasAccess', true);

        $this->assertIsString($response->json('data.readerSession.token'));
        $this->assertNotNull($response->json('data.readerSession.expires_at'));
        $this->assertDatabaseHas('book_reader_sessions', [
            'user_id' => $profile->id,
            'book_id' => $book->id,
        ]);
    }

    /**
     * @return array{User, Profile}
     */
    private function createReader(): array
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->create(['id' => $user->id, 'email' => $user->email]);

        return [$user, $profile];
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function createBookWithPrivateFile(array $attributes = [], bool $withSample = false): Book
    {
        Storage::fake('books');
        $book = Book::factory()->create($attributes);
        $path = "{$book->id}/book.pdf";
        Storage::disk('books')->put($path, '%PDF-1.4 full-book');
        BookAsset::factory()->create(['book_id' => $book->id, 'storage_path' => $path]);

        if ($withSample) {
            $samplePath = "{$book->id}/samples/preview.pdf";
            Storage::disk('books')->put($samplePath, '%PDF-1.4 preview-only');
            $book->forceFill(['sample_url' => $samplePath])->saveQuietly();
        }

        return $book;
    }
}
