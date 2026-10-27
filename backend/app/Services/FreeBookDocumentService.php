<?php

namespace App\Services;

use App\Models\Book;
use Illuminate\Support\Facades\Storage;

class FreeBookDocumentService
{
    /**
     * Find a private PDF/EPUB source without copying or rendering it.
     *
     * @return array{disk:string,path:string,mime:string,extension:string}
     */
    public function locate(Book $book): array
    {
        $book->loadMissing(['assets', 'formats']);
        $candidates = [];

        foreach ($book->assets->where('asset_type', 'full_book')->where('is_published', true) as $asset) {
            $candidates[] = $asset->storage_path;
        }

        foreach ($book->formats->where('is_published', true)->whereIn('format', ['holistique_store', 'ebook']) as $format) {
            $candidates[] = $format->file_url;
        }

        $candidates[] = $book->file_url;

        foreach ($candidates as $candidate) {
            if (! is_string($candidate) || trim($candidate) === '') {
                continue;
            }

            $path = ltrim(trim($candidate), '/');
            if (str_contains($path, '..') || str_contains($path, '://') || str_contains($path, '\\')) {
                continue;
            }

            $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
            if (! in_array($extension, ['pdf', 'epub'], true)) {
                continue;
            }

            foreach (['books', 'local'] as $disk) {
                if (Storage::disk($disk)->exists($path)) {
                    return [
                        'disk' => $disk,
                        'path' => $path,
                        'mime' => $extension === 'pdf' ? 'application/pdf' : 'application/epub+zip',
                        'extension' => $extension,
                    ];
                }

                if ($disk === 'local' && ! str_starts_with($path, 'books/')
                    && Storage::disk('local')->exists('books/'.$path)) {
                    return [
                        'disk' => 'local',
                        'path' => 'books/'.$path,
                        'mime' => $extension === 'pdf' ? 'application/pdf' : 'application/epub+zip',
                        'extension' => $extension,
                    ];
                }
            }
        }

        abort(404, 'Fichier de lecture gratuit introuvable.');
    }
}
