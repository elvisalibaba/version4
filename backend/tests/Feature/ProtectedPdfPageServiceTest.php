<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Services\PdfPageImageRenderer;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProtectedPdfPageServiceTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_preview_returns_a_page_rendered_by_the_available_pdf_engine(): void
    {
        Storage::fake('books');
        Storage::fake('local');
        $book = $this->bookWithPreview();

        $renderer = $this->mock(PdfPageImageRenderer::class);
        $renderer->shouldReceive('isAvailable')->once()->andReturnTrue();
        $renderer->shouldReceive('render')
            ->once()
            ->withArgs(function (string $source, int $page, string $output, int $size): bool {
                File::put($output, 'rendered-jpeg');

                return File::isFile($source)
                    && $page === 1
                    && $size === 1800;
            });

        $response = $this->get("/api/v1/books/{$book->id}/preview/pages/1");

        $response->assertOk()->assertHeader('Content-Type', 'image/jpeg');
        $this->assertSame('rendered-jpeg', $response->streamedContent());
    }

    public function test_preview_returns_503_when_no_secure_pdf_engine_is_available(): void
    {
        Storage::fake('books');
        Storage::fake('local');
        $book = $this->bookWithPreview();

        $renderer = $this->mock(PdfPageImageRenderer::class);
        $renderer->shouldReceive('isAvailable')->once()->andReturnFalse();
        $renderer->shouldNotReceive('render');

        $this->getJson("/api/v1/books/{$book->id}/preview/pages/1")
            ->assertServiceUnavailable()
            ->assertJsonPath(
                'message',
                'Le moteur de rendu PDF sécurisé n’est pas disponible sur ce serveur (pdftoppm ou Imagick requis).',
            );
    }

    private function bookWithPreview(): Book
    {
        $book = Book::factory()->create([
            'sample_pages' => 3,
            'can_read_on_platform' => true,
        ]);
        $previewPath = "{$book->id}/samples/preview.pdf";
        Storage::disk('books')->put($previewPath, '%PDF-1.4 preview-only');
        $book->forceFill(['sample_url' => $previewPath])->saveQuietly();

        return $book;
    }
}
