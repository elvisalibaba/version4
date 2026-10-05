<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\Profile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookReaderRightsAndAuthorWorkspaceTest extends TestCase
{
    use RefreshDatabase;

    public function test_book_exposes_contractual_reader_permissions(): void
    {
        $book = Book::factory()->create([
            'reading_access_mode' => 'licensed_read_only',
            'can_read_on_platform' => true,
            'allow_download' => false,
            'allow_print' => false,
            'allow_copy' => false,
            'reader_watermark_enabled' => true,
            'rights_agreement_reference' => 'HB-RIGHTS-2026-0042',
        ]);

        $this->assertSame([
            'mode' => 'licensed_read_only',
            'can_read_on_platform' => true,
            'can_download' => false,
            'can_print' => false,
            'can_copy' => false,
            'watermark' => true,
        ], $book->readerPermissions());
    }

    public function test_manuscript_versions_are_attached_to_the_book(): void
    {
        $book = Book::factory()->draft()->create();
        $author = Profile::factory()->author()->create();

        $book->manuscriptVersions()->create([
            'created_by' => $author->id,
            'version_number' => 1,
            'file_path' => 'catalog/'.$book->id.'/manuscript-v1.pdf',
            'file_format' => 'pdf',
            'file_size' => 12345,
            'status' => 'author_draft',
            'change_summary' => 'Version initiale.',
        ]);

        $this->assertSame(1, $book->manuscriptVersions()->count());
        $this->assertSame(1, $book->manuscriptVersions()->firstOrFail()->version_number);
    }
}
