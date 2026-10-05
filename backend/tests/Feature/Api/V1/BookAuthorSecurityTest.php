<?php

namespace Tests\Feature\Api\V1;

use App\Models\AuthorProfile;
use App\Models\Book;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BookAuthorSecurityTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_author_cannot_change_contractual_reader_rights_through_book_api(): void
    {
        [$user, $profile] = $this->author();

        $book = Book::factory()->draft()->create([
            'author_id' => $profile->id,
            'reading_access_mode' => 'licensed_read_only',
            'can_read_on_platform' => true,
            'allow_download' => false,
            'allow_print' => false,
            'allow_copy' => false,
            'reader_watermark_enabled' => true,
            'rights_agreement_reference' => 'HB-RIGHTS-LOCKED',
            'reader_rights_note' => 'Restrictions contractuelles.',
        ]);

        Sanctum::actingAs($user);

        $this->putJson("/api/v1/books/{$book->id}", [
            'title' => 'Titre auteur mis à jour',
            'reading_access_mode' => 'standard',
            'can_read_on_platform' => false,
            'allow_download' => true,
            'allow_print' => true,
            'allow_copy' => true,
            'reader_watermark_enabled' => false,
            'rights_agreement_reference' => 'TENTATIVE-AUTEUR',
            'reader_rights_note' => 'Tentative de modification.',
        ])->assertOk()
            ->assertJsonPath('data.title', 'Titre auteur mis à jour');

        $fresh = $book->fresh();

        $this->assertSame('licensed_read_only', $fresh->reading_access_mode);
        $this->assertTrue((bool) $fresh->can_read_on_platform);
        $this->assertFalse((bool) $fresh->allow_download);
        $this->assertFalse((bool) $fresh->allow_print);
        $this->assertFalse((bool) $fresh->allow_copy);
        $this->assertTrue((bool) $fresh->reader_watermark_enabled);
        $this->assertSame('HB-RIGHTS-LOCKED', $fresh->rights_agreement_reference);
        $this->assertSame('Restrictions contractuelles.', $fresh->reader_rights_note);
    }

    public function test_author_manuscript_replacement_is_archived_as_a_new_version(): void
    {
        Storage::fake('books');
        Storage::fake('public');

        [$user, $profile] = $this->author();
        $book = Book::factory()->draft()->create([
            'author_id' => $profile->id,
            'title' => 'Manuscrit versionné',
        ]);

        Sanctum::actingAs($user);

        $file = UploadedFile::fake()->create(
            'manuscrit-v2.pdf',
            128,
            'application/pdf',
        );

        $this->post("/api/v1/books/{$book->id}", [
            'title' => $book->title,
            'file' => $file,
            'file_format' => 'pdf',
        ], ['Accept' => 'application/json'])
            ->assertOk();

        $version = $book->fresh()->manuscriptVersions()->firstOrFail();

        $this->assertSame(1, $version->version_number);
        $this->assertSame('pdf', $version->file_format);
        $this->assertSame($profile->id, $version->created_by);
        $this->assertSame('author_draft', $version->status);

        $this->assertDatabaseHas('book_editorial_events', [
            'book_id' => $book->id,
            'event_type' => 'manuscript_version_uploaded',
            'actor_id' => $profile->id,
        ]);
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
