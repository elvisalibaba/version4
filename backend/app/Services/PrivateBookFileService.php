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
        $path = $this->resolvePath($book);
        $disk = Storage::disk('books');

        if (! $disk->exists($path)) {
            abort(404, 'Aucun fichier lisible disponible.');
        }

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
        ]);
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

        return $path;
    }

    private function mimeTypeFromPath(string $path): string
    {
        return str_ends_with(mb_strtolower($path), '.pdf') ? 'application/pdf' : 'application/epub+zip';
    }
}
