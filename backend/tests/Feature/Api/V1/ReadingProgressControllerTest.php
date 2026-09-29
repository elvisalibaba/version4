<?php

namespace Tests\Feature\Api\V1;

use App\Models\Book;
use App\Models\Library;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReadingProgressControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_reader_can_save_pdf_progress_and_refresh_library_activity(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $profile = Profile::factory()->create([
            'id' => $user->id,
            'email' => $user->email,
            'role' => 'reader',
        ]);
        $book = Book::factory()->create();
        $entry = Library::factory()->create([
            'user_id' => $profile->id,
            'book_id' => $book->id,
            'access_type' => 'purchase',
            'status' => 'active',
            'last_opened_at' => null,
        ]);

        Sanctum::actingAs($user);

        $this->putJson("/api/v1/books/{$book->id}/progress", [
            'locator' => '17',
            'locator_type' => 'pdf_page',
            'progress_percent' => 34,
            'device_name' => 'web',
        ])->assertCreated()
            ->assertJsonPath('data.locator', '17')
            ->assertJsonPath('data.locator_type', 'pdf_page');

        $this->assertDatabaseHas('reading_progress', [
            'user_id' => $profile->id,
            'book_id' => $book->id,
            'locator' => '17',
            'locator_type' => 'pdf_page',
        ]);

        $this->assertNotNull($entry->fresh()->last_opened_at);
    }

    public function test_reader_can_save_epub_cfi_progress(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $profile = Profile::factory()->create([
            'id' => $user->id,
            'email' => $user->email,
            'role' => 'reader',
        ]);
        $book = Book::factory()->create();
        Library::factory()->create([
            'user_id' => $profile->id,
            'book_id' => $book->id,
            'access_type' => 'purchase',
            'status' => 'active',
        ]);

        Sanctum::actingAs($user);

        $this->putJson("/api/v1/books/{$book->id}/progress", [
            'locator' => 'epubcfi(/6/2[chapter]!/4/2/8)',
            'locator_type' => 'epub_cfi',
            'progress_percent' => 52.5,
            'device_name' => 'web',
        ])->assertCreated()
            ->assertJsonPath('data.locator_type', 'epub_cfi');
    }
}
