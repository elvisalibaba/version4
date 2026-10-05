<?php

namespace Tests\Feature\Api\V1;

use App\Models\AuthorProfile;
use App\Models\Book;
use App\Models\Profile;
use App\Models\PublishingReviewCase;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthorReviewCaseControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_author_can_appeal_a_review_case_for_their_book(): void
    {
        [$user, $profile] = $this->author();
        $book = Book::factory()->create(['author_id' => $profile->id]);

        $case = PublishingReviewCase::query()->create([
            'book_id' => $book->id,
            'author_id' => $profile->id,
            'case_number' => 'HB-REV-TEST-001',
            'case_type' => 'rights',
            'severity' => 'blocking',
            'status' => 'rejected',
            'reason_code' => 'RIGHTS-PROOF-MISSING',
            'title' => 'Preuve de droits manquante',
            'explanation' => 'Le document fourni ne couvre pas la distribution numérique.',
        ]);

        Sanctum::actingAs($user);

        $this->postJson("/api/v1/author/review-cases/{$case->id}/appeal", [
            'author_response' => 'Je joins une nouvelle autorisation couvrant explicitement la diffusion numérique.',
        ])->assertOk()
            ->assertJsonPath('data.status', 'appealed');

        $this->assertDatabaseHas('publishing_review_cases', [
            'id' => $case->id,
            'status' => 'appealed',
        ]);

        $this->assertDatabaseHas('platform_audit_events', [
            'entity_id' => $case->id,
            'action' => 'publishing_review.appealed',
            'actor_id' => $profile->id,
        ]);
    }

    public function test_author_cannot_appeal_another_authors_case(): void
    {
        [$owner, $ownerProfile] = $this->author();
        [$intruder] = $this->author();

        $book = Book::factory()->create(['author_id' => $ownerProfile->id]);
        $case = PublishingReviewCase::query()->create([
            'book_id' => $book->id,
            'author_id' => $ownerProfile->id,
            'case_number' => 'HB-REV-TEST-002',
            'case_type' => 'quality',
            'severity' => 'warning',
            'status' => 'rejected',
            'title' => 'Qualité éditoriale',
            'explanation' => 'Corrections nécessaires avant publication.',
        ]);

        Sanctum::actingAs($intruder);

        $this->postJson("/api/v1/author/review-cases/{$case->id}/appeal", [
            'author_response' => 'Tentative de recours sur le dossier d’un autre auteur.',
        ])->assertNotFound();
    }

    private function author(): array
    {
        $user = User::factory()->create();
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
