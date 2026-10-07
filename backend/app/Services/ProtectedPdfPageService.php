<?php

namespace App\Services;

use App\Models\Book;
use Illuminate\Contracts\Cache\Lock;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

class ProtectedPdfPageService
{
    public function __construct(private PdfPageImageRenderer $renderer) {}

    /**
     * @return array{disk:string,path:string,mime:string}
     */
    public function renderBookPage(Book $book, int $page): array
    {
        [$sourcePath, $diskName] = $this->bookPdfPath($book);

        return $this->render($book, $diskName, $sourcePath, $page, 'full');
    }

    /**
     * @return array{disk:string,path:string,mime:string}
     */
    public function renderPreviewPage(Book $book, int $page): array
    {
        $path = is_string($book->sample_url) ? ltrim($book->sample_url, '/') : '';

        abort_if($path === '', 404, 'Aucun aperçu sécurisé disponible.');
        abort_unless(Storage::disk('books')->exists($path), 404, 'Aucun aperçu sécurisé disponible.');
        abort_unless(mb_strtolower(pathinfo($path, PATHINFO_EXTENSION)) === 'pdf', 422, 'L’aperçu protégé doit être un PDF.');

        return $this->render($book, 'books', $path, $page, 'preview');
    }

    /**
     * @return array{disk:string,path:string,mime:string}
     */
    private function render(Book $book, string $sourceDisk, string $sourcePath, int $page, string $scope): array
    {
        abort_if($page < 1, 404);

        if ($scope === 'full' && $book->page_count !== null) {
            abort_if($page > (int) $book->page_count, 404, 'Page inexistante.');
        }

        if ($scope === 'preview') {
            $previewLimit = max(1, min(10, (int) ($book->sample_pages ?: 10)));
            abort_if($page > $previewLimit, 403, 'La limite de l’aperçu gratuit est atteinte.');
        }

        $fingerprint = sha1(implode('|', [
            $sourcePath,
            (string) Storage::disk($sourceDisk)->size($sourcePath),
            $scope,
        ]));

        $cachePath = "reader-pages/{$book->id}/{$fingerprint}/{$scope}-{$page}.jpg";
        if (Storage::disk('local')->exists($cachePath)) {
            return ['disk' => 'local', 'path' => $cachePath, 'mime' => 'image/jpeg'];
        }

        abort_unless(
            $this->renderer->isAvailable(),
            503,
            'Le moteur de rendu PDF sécurisé n’est pas disponible sur ce serveur (pdftoppm ou Imagick requis).',
        );

        // Chaque rendu occupe un worker PHP jusqu'à 30 s : on borne le nombre
        // de rendus simultanés pour qu'un afflux (ou un abus) sur l'aperçu
        // public ne sature pas le serveur.
        $slot = $this->acquireRenderSlot();
        abort_if($slot === null, 503, 'Le lecteur est très sollicité, réessayez dans quelques secondes.', ['Retry-After' => '5']);

        try {
            // Une requête concurrente a pu rendre la même page pendant l'attente.
            if (Storage::disk('local')->exists($cachePath)) {
                return ['disk' => 'local', 'path' => $cachePath, 'mime' => 'image/jpeg'];
            }

            return $this->renderToCache($sourceDisk, $sourcePath, $page, $cachePath);
        } finally {
            $slot->release();
        }
    }

    private function acquireRenderSlot(): ?Lock
    {
        $slots = max(1, (int) config('books.pdf.max_concurrent_renders', 3));
        $ttl = (int) config('books.pdf.process_timeout', 30) + 15;
        $deadline = microtime(true) + 3;

        do {
            for ($slot = 0; $slot < $slots; $slot++) {
                $lock = Cache::lock('reader-pdf-render-slot:'.$slot, $ttl);

                if ($lock->get()) {
                    return $lock;
                }
            }

            usleep(250_000);
        } while (microtime(true) < $deadline);

        return null;
    }

    /**
     * @return array{disk:string,path:string,mime:string}
     */
    private function renderToCache(string $sourceDisk, string $sourcePath, int $page, string $cachePath): array
    {
        [$absolutePath, $temporarySource] = $this->materialize($sourceDisk, $sourcePath);
        $temporaryDirectory = sys_get_temp_dir().'/holistic-reader-'.bin2hex(random_bytes(8));
        File::ensureDirectoryExists($temporaryDirectory, 0700);
        $outputPrefix = $temporaryDirectory.'/page';

        try {
            $generated = $outputPrefix.'.jpg';
            $this->renderer->render(
                $absolutePath,
                $page,
                $generated,
                (int) config('books.pdf.reader_page_size', 1800),
            );

            if (! File::isFile($generated)) {
                throw new RuntimeException('Impossible de rendre cette page PDF.');
            }

            $stream = fopen($generated, 'rb');
            if ($stream === false) {
                throw new RuntimeException('Impossible de lire la page PDF rendue.');
            }

            try {
                Storage::disk('local')->put($cachePath, $stream);
            } finally {
                fclose($stream);
            }

            return ['disk' => 'local', 'path' => $cachePath, 'mime' => 'image/jpeg'];
        } finally {
            File::deleteDirectory($temporaryDirectory);

            if ($temporarySource !== null) {
                File::delete($temporarySource);
            }
        }
    }

    /**
     * @return array{0:string,1:string}
     */
    private function bookPdfPath(Book $book): array
    {
        $book->loadMissing(['assets', 'formats']);

        $assetPath = $book->assets
            ->where('asset_type', 'full_book')
            ->where('is_published', true)
            ->where('delivery_format', 'pdf')
            ->first()?->storage_path;

        $formatPath = $book->formats
            ->where('is_published', true)
            ->whereIn('format', ['holistique_store', 'ebook'])
            ->first(fn ($format) => mb_strtolower(pathinfo((string) $format->file_url, PATHINFO_EXTENSION)) === 'pdf')
            ?->file_url;

        $path = $assetPath ?? $formatPath ?? $book->file_url;

        abort_unless(is_string($path) && $path !== '', 404, 'Aucun PDF protégé disponible.');
        abort_if(str_starts_with($path, 'http://') || str_starts_with($path, 'https://'), 404, 'Le fichier source doit rester privé.');
        abort_unless(mb_strtolower(pathinfo($path, PATHINFO_EXTENSION)) === 'pdf', 422, 'Ce titre n’est pas disponible dans le lecteur PDF protégé.');

        $path = ltrim($path, '/');

        foreach (['books', 'local'] as $diskName) {
            if (Storage::disk($diskName)->exists($path)) {
                return [$path, $diskName];
            }

            if ($diskName === 'local' && ! str_starts_with($path, 'books/') && Storage::disk('local')->exists('books/'.$path)) {
                return ['books/'.$path, 'local'];
            }
        }

        abort(404, 'Aucun PDF privé lisible disponible.');
    }

    /**
     * @return array{0:string,1:string|null}
     */
    private function materialize(string $diskName, string $storagePath): array
    {
        try {
            return [Storage::disk($diskName)->path($storagePath), null];
        } catch (Throwable) {
            $temporaryPath = tempnam(sys_get_temp_dir(), 'holistic-reader-pdf-');
            if ($temporaryPath === false) {
                throw new RuntimeException('Impossible de préparer le PDF pour le rendu.');
            }

            $source = Storage::disk($diskName)->readStream($storagePath);
            $destination = fopen($temporaryPath, 'wb');

            if ($source === false || $destination === false) {
                throw new RuntimeException('Impossible de matérialiser le PDF.');
            }

            try {
                stream_copy_to_stream($source, $destination);
            } finally {
                fclose($source);
                fclose($destination);
            }

            return [$temporaryPath, $temporaryPath];
        }
    }
}
