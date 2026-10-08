<?php

namespace Tests\Feature\Api\V1;

use App\Http\Resources\PublicBookResource;
use App\Models\AuthorProfile;
use App\Models\Book;
use App\Models\BookFormat;
use App\Models\FlashSaleConfig;
use App\Models\HomeFeaturedConfig;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PublicBookPayloadTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_public_book_endpoints_never_expose_internal_fields(): void
    {
        $book = $this->bookWithInternalData();
        HomeFeaturedConfig::query()->create(['scope' => 'global', 'selected_book_ids' => [$book->id]]);
        FlashSaleConfig::query()->create(['scope' => 'global', 'selected_book_ids' => [$book->id], 'discount_percentage' => 15]);

        $payloads = [
            'index' => $this->getJson('/api/v1/books')->assertOk()->json('data.0'),
            'show' => $this->getJson("/api/v1/books/{$book->id}")->assertOk()->json('data'),
            'featured' => $this->getJson('/api/v1/home/featured')->assertOk()->json('data.0'),
            'flash-sale' => $this->getJson('/api/v1/home/flash-sale')->assertOk()->json('books.0'),
        ];

        foreach ($payloads as $endpoint => $payload) {
            $this->assertSame($book->id, $payload['id'], $endpoint);

            foreach (PublicBookResource::INTERNAL_KEYS as $key) {
                $this->assertArrayNotHasKey($key, $payload, "{$endpoint} expose {$key}");
            }

            $this->assertNotEmpty($payload['formats'], $endpoint);

            foreach ($payload['formats'] as $format) {
                $this->assertArrayNotHasKey('printing_cost', $format, "{$endpoint} expose printing_cost");
            }
        }
    }

    public function test_author_workspace_keeps_the_full_resource(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $profile = Profile::factory()->author()->create(['id' => $user->id, 'email' => $user->email]);
        AuthorProfile::query()->create(['id' => $profile->id, 'display_name' => $profile->name]);
        $book = $this->bookWithInternalData(['author_id' => $profile->id]);
        Sanctum::actingAs($user);

        $this->getJson("/api/v1/author/books/{$book->id}")
            ->assertOk()
            ->assertJsonPath('data.review_note', 'Note interne du comité.')
            ->assertJsonPath('data.views_count', 120)
            ->assertJsonPath('data.formats.0.printing_cost', '2.50');
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function bookWithInternalData(array $attributes = []): Book
    {
        $book = Book::factory()->create([
            'review_note' => 'Note interne du comité.',
            'copyright_note' => 'Contrat en cours.',
            'editorial_stage' => 'published',
            'bat_status' => 'approved',
            'bat_approved_at' => now(),
            'spiritual_metadata' => ['tradition' => 'évangélique'],
            'views_count' => 120,
            'clicks_count' => 30,
            'submitted_at' => now()->subWeek(),
            'reviewed_at' => now()->subDays(2),
            ...$attributes,
        ]);
        BookFormat::factory()->create(['book_id' => $book->id, 'format' => 'paperback', 'printing_cost' => 2.5]);

        return $book;
    }
}
