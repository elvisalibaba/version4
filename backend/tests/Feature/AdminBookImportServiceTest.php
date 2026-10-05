<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\Profile;
use App\Services\AdminBookImportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use ZipArchive;

class AdminBookImportServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_import_a_prepared_multi_author_zip_batch(): void
    {
        if (! class_exists(ZipArchive::class)) {
            $this->markTestSkipped('PHP ZIP extension is not available.');
        }

        Storage::fake('books');
        Storage::fake('public');

        $administrator = Profile::factory()->admin()->create();

        Storage::disk('books')->makeDirectory('admin-imports/prepared');
        $archivePath = 'admin-imports/prepared/test-batch.zip';
        $absoluteArchivePath = Storage::disk('books')->path($archivePath);

        $zip = new ZipArchive();
        $this->assertTrue($zip->open($absoluteArchivePath, ZipArchive::CREATE | ZipArchive::OVERWRITE));

        $manifest = [
            'version' => 1,
            'books' => [
                [
                    'file' => 'books/livre-1.pdf',
                    'cover' => 'covers/livre-1.webp',
                    'title' => 'Livre Un',
                    'author' => 'Auteur Un',
                    'publisher' => 'Éditeur Un',
                    'edition' => '2e édition',
                    'isbn' => '9780000000001',
                    'language' => 'fr',
                    'page_count' => 123,
                    'categories' => ['Développement personnel'],
                ],
                [
                    'file' => 'books/livre-2.pdf',
                    'cover' => 'covers/livre-2.webp',
                    'title' => 'Livre Deux',
                    'author' => 'Auteur Deux',
                    'language' => 'fr',
                    'page_count' => 87,
                    'categories' => ['Roman'],
                ],
            ],
        ];

        $zip->addFromString('manifest.json', json_encode($manifest, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        $zip->addFromString('books/livre-1.pdf', "%PDF-1.4\nLivre un");
        $zip->addFromString('books/livre-2.pdf', "%PDF-1.4\nLivre deux");
        $zip->addFromString('covers/livre-1.webp', 'cover-one');
        $zip->addFromString('covers/livre-2.webp', 'cover-two');
        $zip->close();

        /** @var AdminBookImportService $service */
        $service = app(AdminBookImportService::class);
        $batch = $service->importPreparedArchive($archivePath, $administrator);

        $this->assertSame(2, $batch->completed_items);
        $this->assertSame(0, $batch->failed_items);

        $this->assertDatabaseHas('books', [
            'title' => 'Livre Un',
            'author_display_name' => 'Auteur Un',
            'publisher' => 'Éditeur Un',
            'edition' => '2e édition',
            'price' => 0,
            'status' => 'draft',
            'copyright_status' => 'review',
            'is_single_sale_enabled' => 1,
        ]);

        $this->assertDatabaseHas('books', [
            'title' => 'Livre Deux',
            'author_display_name' => 'Auteur Deux',
            'price' => 0,
            'status' => 'draft',
            'copyright_status' => 'review',
            'is_single_sale_enabled' => 1,
        ]);

        $book = Book::query()->where('title', 'Livre Un')->firstOrFail();

        $this->assertSame(123, $book->page_count);
        $this->assertSame(['Développement personnel'], $book->categories);
        $this->assertNotNull($book->cover_url);
        Storage::disk('books')->assertExists($book->file_url);
        Storage::disk('public')->assertExists($book->cover_url);
    }

    public function test_raw_zip_without_manifest_author_or_cover_is_still_imported(): void
    {
        if (! class_exists(ZipArchive::class)) {
            $this->markTestSkipped('PHP ZIP extension is not available.');
        }

        Storage::fake('books');
        Storage::fake('public');

        $administrator = Profile::factory()->admin()->create();
        Storage::disk('books')->makeDirectory('admin-imports/prepared');

        $archivePath = 'admin-imports/prepared/raw-bible.zip';
        $absoluteArchivePath = Storage::disk('books')->path($archivePath);

        $zip = new ZipArchive();
        $this->assertTrue($zip->open($absoluteArchivePath, ZipArchive::CREATE | ZipArchive::OVERWRITE));
        $zip->addFromString('books/Bible-Louis-Segond.pdf', "%PDF-1.4\n/Type /Page\n");
        $zip->close();

        $batch = app(AdminBookImportService::class)
            ->importPreparedArchive($archivePath, $administrator);

        $this->assertSame(1, $batch->completed_items);
        $this->assertSame(0, $batch->failed_items);

        $book = Book::query()->where('title', 'Bible Louis Segond')->firstOrFail();

        $this->assertNull($book->author_id);
        $this->assertSame('sacred_text', $book->authorship_type);
        $this->assertSame('ecclesial', $book->editorial_pole);
        $this->assertSame('bible', $book->work_type);
        $this->assertNotNull($book->cover_url);
        Storage::disk('public')->assertExists($book->cover_url);
    }


    public function test_manifest_without_cover_field_still_pairs_matching_cover_by_filename(): void
    {
        if (! class_exists(ZipArchive::class)) {
            $this->markTestSkipped('PHP ZIP extension is not available.');
        }

        Storage::fake('books');
        Storage::fake('public');

        $administrator = Profile::factory()->admin()->create();
        Storage::disk('books')->makeDirectory('admin-imports/prepared');

        $archivePath = 'admin-imports/prepared/implicit-cover.zip';
        $absoluteArchivePath = Storage::disk('books')->path($archivePath);

        $zip = new ZipArchive();
        $this->assertTrue($zip->open($absoluteArchivePath, ZipArchive::CREATE | ZipArchive::OVERWRITE));

        $manifest = [
            'version' => 1,
            'books' => [
                [
                    'file' => 'books/manuel-spirituel.pdf',
                    'title' => 'Manuel spirituel',
                    'authorship_type' => 'anonymous',
                    'editorial_pole' => 'ecclesial',
                    'work_type' => 'devotional',
                ],
            ],
        ];

        $zip->addFromString('manifest.json', json_encode($manifest, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        $zip->addFromString('books/manuel-spirituel.pdf', "%PDF-1.4\nManuel spirituel");
        $zip->addFromString('covers/manuel-spirituel.webp', 'explicit-archive-cover');
        $zip->close();

        $batch = app(AdminBookImportService::class)
            ->importPreparedArchive($archivePath, $administrator);

        $this->assertSame(1, $batch->completed_items);
        $this->assertSame(0, $batch->failed_items);

        $book = Book::query()->where('title', 'Manuel spirituel')->firstOrFail();

        $this->assertSame('import', $book->cover_source);
        $this->assertNotNull($book->cover_url);
        Storage::disk('public')->assertExists($book->cover_url);
    }

}
