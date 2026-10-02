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

    public function test_guest_can_stream_a_free_published_book_from_public_endpoint(): void
    {
        $book = $this->createBookWithPrivateFile([
            'price' => 0,
            'status' => 'published',
            'copyright_status' => 'clear',
            'is_single_sale_enabled' => true,
        ]);

        $this->get("/api/v1/books/{$book->id}/read-free")
            ->assertOk()
            ->assertStreamed()
            ->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_guest_can_stream_a_free_book_from_legacy_local_storage(): void
    {
        Storage::fake('books');
        Storage::fake('local');

        $book = Book::factory()->free()->create([
            'price' => 0,
            'status' => 'published',
            'copyright_status' => 'clear',
            'is_single_sale_enabled' => true,
            'file_url' => 'catalog/legacy-book.pdf',
            'file_format' => 'pdf',
        ]);

        Storage::disk('local')->put('catalog/legacy-book.pdf', '%PDF-1.4 legacy');

        $this->get("/api/v1/books/{$book->id}/read-free")
            ->assertOk()
            ->assertStreamed()
            ->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_guest_cannot_stream_a_paid_book_from_public_endpoint(): void
    {
        $book = $this->createBookWithPrivateFile([
            'price' => 5,
            'status' => 'published',
            'copyright_status' => 'clear',
            'is_single_sale_enabled' => true,
        ]);

        $this->getJson("/api/v1/books/{$book->id}/read-free")
            ->assertForbidden()
            ->assertJsonPath('message', 'Ce livre n’est pas disponible en lecture gratuite.');
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

        $this->get("/api/v1/read/{$book->id}")
            ->assertOk()
            ->assertStreamed()
            ->assertHeader('Content-Type', 'application/pdf');

        $this->assertDatabaseHas('library', ['user_id' => $profile->id, 'book_id' => $book->id, 'access_type' => 'free']);
    }

    public function test_purchased_reader_can_stream_a_paid_book(): void
    {
        [$user, $profile] = $this->createReader();
        $book = $this->createBookWithPrivateFile();
        Library::factory()->create(['user_id' => $profile->id, 'book_id' => $book->id]);
        Sanctum::actingAs($user);

        $this->get("/api/v1/read/{$book->id}")->assertOk()->assertStreamed();
    }

    public function test_active_subscription_can_stream_an_included_book(): void
    {
        [$user, $profile] = $this->createReader();
        $book = $this->createBookWithPrivateFile(['is_single_sale_enabled' => false, 'is_subscription_available' => true]);
        $plan = SubscriptionPlan::factory()->create();
        $plan->books()->attach($book, ['id' => (string) Str::uuid(), 'created_at' => now()]);
        Subscription::factory()->create(['user_id' => $profile->id, 'plan_id' => $plan->id]);
        Sanctum::actingAs($user);

        $this->get("/api/v1/read/{$book->id}")->assertOk()->assertStreamed();

        $this->assertDatabaseHas('library', ['user_id' => $profile->id, 'book_id' => $book->id, 'access_type' => 'subscription']);
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
    private function createBookWithPrivateFile(array $attributes = []): Book
    {
        Storage::fake('books');
        $book = Book::factory()->create($attributes);
        $path = "{$book->id}/book.pdf";
        Storage::disk('books')->put($path, '%PDF-1.4 test');
        BookAsset::factory()->create(['book_id' => $book->id, 'storage_path' => $path]);

        return $book;
    }
}
