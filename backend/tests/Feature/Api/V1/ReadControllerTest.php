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

    public function test_guest_can_stream_only_the_secure_preview_sample(): void
    {
        $book = $this->createBookWithPrivateFile([
            'price' => 0,
            'status' => 'published',
            'copyright_status' => 'clear',
            'is_single_sale_enabled' => true,
        ], withSample: true);

        $this->get("/api/v1/books/{$book->id}/read-free")
            ->assertOk()
            ->assertStreamed()
            ->assertHeader('Content-Type', 'application/pdf')
            ->assertHeader('X-Holistique-Preview-Only', '1')
            ->assertHeader('X-Holistique-Download-Allowed', '0');
    }

    public function test_guest_never_receives_the_full_book_when_no_preview_sample_exists(): void
    {
        $book = $this->createBookWithPrivateFile([
            'price' => 0,
            'status' => 'published',
            'copyright_status' => 'clear',
            'is_single_sale_enabled' => true,
        ]);

        $this->getJson("/api/v1/books/{$book->id}/read-free")
            ->assertNotFound()
            ->assertJsonPath('message', 'Aucun aperçu sécurisé disponible.');
    }

    public function test_paid_book_without_entitlement_returns_403(): void
    {
        [$user, $profile] = $this->createReader();
        $book = Book::factory()->create();
        Sanctum::actingAs($user);

        $this->getJson("/api/v1/read/{$book->id}")
            ->assertForbidden()
            ->assertJsonPath('message', 'Vous ne disposez pas d’un accès actif à ce livre.');

        $this->assertDatabaseMissing('library', ['user_id' => $profile->id, 'book_id' => $book->id]);
    }

    public function test_authenticated_reader_can_stream_a_free_book(): void
    {
        [$user, $profile] = $this->createReader();
        $book = $this->createBookWithPrivateFile(['price' => 0]);
        Sanctum::actingAs($user);

        $readerToken = $this->readerToken($book);

        $this->withHeader('X-Holistique-Reader-Token', $readerToken)
            ->get("/api/v1/read/{$book->id}")
            ->assertOk()
            ->assertStreamed()
            ->assertHeader('Content-Type', 'application/pdf')
            ->assertHeader('X-Holistique-Download-Allowed', '0');

        $this->assertDatabaseHas('library', ['user_id' => $profile->id, 'book_id' => $book->id, 'access_type' => 'free']);
    }

    public function test_purchased_reader_can_stream_a_paid_book(): void
    {
        [$user, $profile] = $this->createReader();
        $book = $this->createBookWithPrivateFile();
        Library::factory()->create(['user_id' => $profile->id, 'book_id' => $book->id]);
        Sanctum::actingAs($user);

        $readerToken = $this->readerToken($book);

        $this->withHeader('X-Holistique-Reader-Token', $readerToken)
            ->get("/api/v1/read/{$book->id}")
            ->assertOk()
            ->assertStreamed();
    }

    public function test_active_subscription_can_stream_an_included_book(): void
    {
        [$user, $profile] = $this->createReader();
        $book = $this->createBookWithPrivateFile(['is_single_sale_enabled' => false, 'is_subscription_available' => true]);
        $plan = SubscriptionPlan::factory()->create();
        $plan->books()->attach($book, ['id' => (string) Str::uuid(), 'created_at' => now()]);
        Subscription::factory()->create(['user_id' => $profile->id, 'plan_id' => $plan->id]);
        Sanctum::actingAs($user);

        $readerToken = $this->readerToken($book);

        $this->withHeader('X-Holistique-Reader-Token', $readerToken)
            ->get("/api/v1/read/{$book->id}")
            ->assertOk()
            ->assertStreamed();

        $this->assertDatabaseHas('library', ['user_id' => $profile->id, 'book_id' => $book->id, 'access_type' => 'subscription']);
    }

    private function readerToken(Book $book): string
    {
        $response = $this->withHeader('X-Holistique-Reader', 'test')
            ->getJson("/api/v1/books/{$book->id}/access")
            ->assertOk()
            ->assertJsonPath('data.hasAccess', true);

        $token = $response->json('data.readerSession.token');
        $this->assertIsString($token);
        $this->assertNotSame('', $token);

        return $token;
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
