<?php

namespace Tests\Feature\Api\V1;

use App\Models\AuthorProfile;
use App\Models\Book;
use App\Models\Library;
use App\Models\Profile;
use App\Models\Rating;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReviewControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_verified_user_can_create_review(): void
    {
        [$user, $profile] = $this->reader();
        $book = Book::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson("/api/v1/books/{$book->id}/reviews", [
            'rating' => 5,
            'text' => 'Excellent livre.',
        ])->assertCreated()
            ->assertJsonPath('data.rating', 5)
            ->assertJsonPath('data.text', 'Excellent livre.')
            ->assertJsonPath('data.is_mine', true)
            ->assertJsonPath('data.verified_purchase', false);

        $this->assertDatabaseHas('ratings', [
            'user_id' => $profile->id,
            'book_id' => $book->id,
            'rating' => 5,
            'review_text' => 'Excellent livre.',
        ]);
    }

    public function test_duplicate_review_is_rejected(): void
    {
        [$user, $profile] = $this->reader();
        $book = Book::factory()->create();
        Rating::factory()->create(['user_id' => $profile->id, 'book_id' => $book->id]);
        Sanctum::actingAs($user);

        $this->postJson("/api/v1/books/{$book->id}/reviews", [
            'rating' => 4,
            'text' => 'Deuxième avis.',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('rating');

        $this->assertSame(
            1,
            Rating::query()->where('user_id', $profile->id)->where('book_id', $book->id)->count(),
        );
    }

    public function test_purchase_access_marks_review_as_verified(): void
    {
        [$user, $profile] = $this->reader();
        $book = Book::factory()->create();

        Library::factory()->create([
            'user_id' => $profile->id,
            'book_id' => $book->id,
            'access_type' => 'purchase',
            'status' => 'active',
        ]);

        Rating::factory()->create(['user_id' => $profile->id, 'book_id' => $book->id]);
        Sanctum::actingAs($user);

        $this->getJson("/api/v1/books/{$book->id}/reviews")
            ->assertOk()
            ->assertJsonPath('data.0.verified_purchase', true);
    }

    public function test_active_subscription_marks_review_as_verified(): void
    {
        [$user, $profile] = $this->reader();
        $book = Book::factory()->subscriptionOnly()->create();
        $plan = SubscriptionPlan::factory()->create();
        $plan->books()->attach($book->id, ['id' => (string) Str::uuid()]);

        Subscription::factory()->create([
            'user_id' => $profile->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'expires_at' => now()->addWeek(),
        ]);

        Rating::factory()->create(['user_id' => $profile->id, 'book_id' => $book->id]);
        Sanctum::actingAs($user);

        $this->getJson("/api/v1/books/{$book->id}/reviews")
            ->assertOk()
            ->assertJsonPath('data.0.verified_purchase', true);
    }

    public function test_free_book_without_library_entry_is_not_verified(): void
    {
        [$user, $profile] = $this->reader();
        $book = Book::factory()->free()->create();
        Rating::factory()->create(['user_id' => $profile->id, 'book_id' => $book->id]);
        Sanctum::actingAs($user);

        $this->getJson("/api/v1/books/{$book->id}/reviews")
            ->assertOk()
            ->assertJsonPath('data.0.verified_purchase', false);
    }

    public function test_free_book_with_library_entry_is_verified(): void
    {
        [$user, $profile] = $this->reader();
        $book = Book::factory()->free()->create();

        Library::factory()->create([
            'user_id' => $profile->id,
            'book_id' => $book->id,
            'access_type' => 'free',
            'status' => 'active',
        ]);

        Rating::factory()->create(['user_id' => $profile->id, 'book_id' => $book->id]);
        Sanctum::actingAs($user);

        $this->getJson("/api/v1/books/{$book->id}/reviews")
            ->assertOk()
            ->assertJsonPath('data.0.verified_purchase', true);
    }

    public function test_author_cannot_review_own_book(): void
    {
        [$user, $profile] = $this->reader();
        AuthorProfile::factory()->create(['id' => $profile->id]);
        $book = Book::factory()->create(['author_id' => $profile->id]);
        Sanctum::actingAs($user);

        $this->postJson("/api/v1/books/{$book->id}/reviews", [
            'rating' => 5,
            'text' => 'Mon propre livre.',
        ])->assertForbidden()
            ->assertJsonPath('message', 'Vous ne pouvez pas noter votre propre livre.');

        $this->assertDatabaseMissing('ratings', [
            'user_id' => $profile->id,
            'book_id' => $book->id,
        ]);

        $this->getJson("/api/v1/books/{$book->id}/reviews")
            ->assertOk()
            ->assertJsonPath('can_review', false);
    }

    public function test_admin_cannot_edit_another_users_review_through_the_api(): void
    {
        [$admin] = $this->admin();
        $review = Rating::factory()->create(['rating' => 2]);
        Sanctum::actingAs($admin);

        $this->putJson("/api/v1/reviews/{$review->id}", [
            'rating' => 5,
            'text' => 'Texte modifié par un admin.',
        ])->assertForbidden();

        $this->assertDatabaseHas('ratings', ['id' => $review->id, 'rating' => 2]);
    }

    public function test_public_review_exposes_short_name_and_no_internal_id(): void
    {
        $book = Book::factory()->create();
        $profile = Profile::factory()->create([
            'first_name' => 'Marie',
            'last_name' => 'Kabongo',
            'role' => 'reader',
        ]);
        Rating::factory()->create(['user_id' => $profile->id, 'book_id' => $book->id]);

        $this->getJson("/api/v1/books/{$book->id}/reviews")
            ->assertOk()
            ->assertJsonPath('data.0.author.name', 'Marie K.')
            ->assertJsonMissingPath('data.0.author.id');
    }

    public function test_book_with_only_hidden_reviews_has_no_rating(): void
    {
        $book = Book::factory()->create();
        Rating::factory()->create([
            'book_id' => $book->id,
            'rating' => 5,
            'is_hidden' => true,
            'hidden_at' => now(),
        ]);

        $this->getJson("/api/v1/books/{$book->id}")
            ->assertOk()
            ->assertJsonPath('data.rating_avg', null)
            ->assertJsonPath('data.ratings_count', 0);
    }

    public function test_review_without_access_is_not_verified(): void
    {
        [$user, $profile] = $this->reader();
        $book = Book::factory()->create(['price' => 12]);
        Rating::factory()->create(['user_id' => $profile->id, 'book_id' => $book->id]);
        Sanctum::actingAs($user);

        $this->getJson("/api/v1/books/{$book->id}/reviews")
            ->assertOk()
            ->assertJsonPath('data.0.verified_purchase', false);
    }

    public function test_user_can_update_and_delete_own_review(): void
    {
        [$user, $profile] = $this->reader();
        $book = Book::factory()->create();
        $review = Rating::factory()->create([
            'user_id' => $profile->id,
            'book_id' => $book->id,
            'rating' => 3,
        ]);
        Sanctum::actingAs($user);

        $this->putJson("/api/v1/reviews/{$review->id}", [
            'rating' => 4,
            'text' => 'Avis corrigé.',
        ])->assertOk()
            ->assertJsonPath('data.rating', 4)
            ->assertJsonPath('data.text', 'Avis corrigé.');

        $this->deleteJson("/api/v1/reviews/{$review->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('ratings', ['id' => $review->id]);
    }

    public function test_user_cannot_modify_another_users_review(): void
    {
        [$owner, $ownerProfile] = $this->reader();
        [$intruder] = $this->reader();
        $book = Book::factory()->create();
        $review = Rating::factory()->create([
            'user_id' => $ownerProfile->id,
            'book_id' => $book->id,
        ]);

        Sanctum::actingAs($intruder);

        $this->putJson("/api/v1/reviews/{$review->id}", [
            'rating' => 1,
            'text' => 'Tentative.',
        ])->assertForbidden();

        $this->deleteJson("/api/v1/reviews/{$review->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('ratings', ['id' => $review->id]);
    }

    public function test_hidden_review_is_not_public_or_counted_in_book_aggregates(): void
    {
        [$admin, $adminProfile] = $this->admin();
        $book = Book::factory()->create();
        Rating::factory()->create([
            'book_id' => $book->id,
            'rating' => 5,
            'is_hidden' => true,
            'hidden_at' => now(),
            'hidden_by' => $adminProfile->id,
            'moderation_note' => 'Spam',
        ]);
        Rating::factory()->create([
            'book_id' => $book->id,
            'rating' => 3,
            'is_hidden' => false,
        ]);

        $this->getJson("/api/v1/books/{$book->id}/reviews")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.rating', 3);

        $this->getJson("/api/v1/books/{$book->id}")
            ->assertOk()
            ->assertJsonPath('data.rating_avg', 3)
            ->assertJsonPath('data.ratings_count', 1);

        $hidden = Rating::query()->where('is_hidden', true)->firstOrFail();
        $this->assertTrue(Gate::forUser($admin)->denies('update', $hidden));
    }

    public function test_reviews_support_recent_and_helpful_sorting(): void
    {
        $book = Book::factory()->create();

        $olderHelpful = Rating::factory()->create([
            'book_id' => $book->id,
            'rating' => 4,
            'helpful_count' => 9,
            'created_at' => now()->subDay(),
        ]);
        $newer = Rating::factory()->create([
            'book_id' => $book->id,
            'rating' => 5,
            'helpful_count' => 1,
            'created_at' => now(),
        ]);

        $this->getJson("/api/v1/books/{$book->id}/reviews?sort=recent")
            ->assertOk()
            ->assertJsonPath('data.0.id', $newer->id);

        $this->getJson("/api/v1/books/{$book->id}/reviews?sort=helpful")
            ->assertOk()
            ->assertJsonPath('data.0.id', $olderHelpful->id);
    }

    private function reader(): array
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->create([
            'id' => $user->id,
            'email' => $user->email,
            'role' => 'reader',
        ]);

        return [$user, $profile];
    }

    private function admin(): array
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->admin()->create([
            'id' => $user->id,
            'email' => $user->email,
        ]);

        return [$user, $profile];
    }
}
