<?php

namespace App\Services;

use App\Models\Book;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PrivateBookFileService
{
    public function store(UploadedFile $file, Book $book): string
    {
        return $file->store($book->id, 'books');
    }

    public function stream(Book $book): StreamedResponse
    {
        [$diskName, $path] = $this->resolveReadableFile($book);
        $disk = Storage::disk($diskName);

        $stream = $disk->readStream($path);
        if ($stream === false) {
            throw new RuntimeException('Impossible d’ouvrir le fichier privé du livre.');
        }

        $mimeType = $disk->mimeType($path) ?: $this->mimeTypeFromPath($path);

        return response()->stream(function () use ($stream): void {
            fpassthru($stream);
            fclose($stream);
        }, 200, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline; filename="book.'.pathinfo($path, PATHINFO_EXTENSION).'"',
            'Cache-Control' => 'private, no-store, no-cache, must-revalidate',
            'Pragma' => 'no-cache',
            'X-Content-Type-Options' => 'nosniff',
            'X-Robots-Tag' => 'noindex, noarchive',
            'X-Holistique-Reading-Mode' => (string) $book->reading_access_mode,
            'X-Holistique-Download-Allowed' => '0',
            'X-Holistique-Print-Allowed' => $book->allow_print ? '1' : '0',
            'X-Holistique-Copy-Allowed' => $book->allow_copy ? '1' : '0',
        ]);
    }

    /**
     * @return array{string, string}
     */
    private function resolveReadableFile(Book $book): array
    {
        $path = $this->resolvePath($book);

        $candidates = [
            ['books', $path],
            ['local', $path],
        ];

        if (! str_starts_with($path, 'books/')) {
            $candidates[] = ['local', 'books/'.$path];
        }

        foreach ($candidates as [$diskName, $candidatePath]) {
            if (Storage::disk($diskName)->exists($candidatePath)) {
                return [$diskName, $candidatePath];
            }
        }

        abort(404, 'Aucun fichier lisible disponible.');
    }

    private function resolvePath(Book $book): string
    {
        $book->loadMissing(['assets', 'formats']);

        $assetPath = $book->assets
            ->where('asset_type', 'full_book')
            ->where('is_published', true)
            ->sortBy(fn ($asset): int => $asset->delivery_format === 'epub' ? 0 : 1)
            ->first()?->storage_path;

        $formatPath = $book->formats
            ->where('is_published', true)
            ->whereIn('format', ['holistique_store', 'ebook'])
            ->sortBy(fn ($format): int => $format->format === 'holistique_store' ? 0 : 1)
            ->first()?->file_url;

        $path = $assetPath ?? $formatPath ?? $book->file_url;
        if (! is_string($path) || $path === '' || str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            abort(404, 'Aucun fichier privé lisible disponible.');
        }

        return ltrim($path, '/');
    }

    private function mimeTypeFromPath(string $path): string
    {
        return match (mb_strtolower(pathinfo($path, PATHINFO_EXTENSION))) {
            'pdf' => 'application/pdf',
            'epub' => 'application/epub+zip',
            'mobi' => 'application/x-mobipocket-ebook',
            'azw', 'azw3' => 'application/vnd.amazon.ebook',
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            default => 'application/octet-stream',
        };
    }
}
