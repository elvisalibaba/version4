<?php

namespace Tests\Feature;

use App\Models\AdminBookImportBatch;
use App\Models\AuthorProfile;
use App\Models\Book;
use App\Models\Profile;
use App\Services\AdminBookPublicationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminBookPublicationServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_publish_all_imported_books_and_repair_imported_author_flags(): void
    {
        $administrator = Profile::factory()->admin()->create();

        $author = AuthorProfile::factory()->create([
            'catalog_origin' => 'admin_import',
            'rights_status' => 'unknown',
            'is_reference_profile' => true,
        ]);

        $batch = AdminBookImportBatch::query()->create([
            'created_by' => $administrator->id,
            'status' => 'completed',
            'total_items' => 2,
            'completed_items' => 2,
            'failed_items' => 0,
            'completed_at' => now(),
        ]);

        foreach (['Livre A', 'Livre B'] as $title) {
            $book = Book::factory()->draft()->create([
                'title' => $title,
                'author_id' => $author->id,
                'author_display_name' => $author->display_name,
                'price' => 0,
                'is_single_sale_enabled' => true,
                'review_status' => 'draft',
                'copyright_status' => 'review',
            ]);

            $book->forceFill([
                'admin_import_batch_id' => $batch->id,
                'admin_imported_by' => $administrator->id,
                'admin_imported_at' => now(),
            ])->save();
        }

        $result = app(AdminBookPublicationService::class)->publishAllImported(
            administrator: $administrator,
            rightsConfirmed: true,
        );

        $this->assertSame(2, $result['published']);
        $this->assertSame(0, $result['failed']);

        $author->refresh();
        $this->assertFalse($author->is_reference_profile);

        foreach (Book::query()->whereNotNull('admin_import_batch_id')->get() as $book) {
            $this->assertSame('published', $book->status);
            $this->assertSame('approved', $book->review_status);
            $this->assertSame('clear', $book->copyright_status);
            $this->assertNotNull($book->published_at);
            $this->assertSame($administrator->id, $book->reviewed_by);
        }
    }

    public function test_admin_must_confirm_rights_before_bulk_publication(): void
    {
        $administrator = Profile::factory()->admin()->create();

        $this->expectException(\InvalidArgumentException::class);

        app(AdminBookPublicationService::class)->publishAllImported(
            administrator: $administrator,
            rightsConfirmed: false,
        );
    }
}
