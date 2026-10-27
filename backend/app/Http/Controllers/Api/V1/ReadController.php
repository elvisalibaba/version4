<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Services\BookAccessService;
use App\Services\FreeBookDocumentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReadController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'message' => 'Le transfert du fichier complet est désactivé. Utilisez le lecteur protégé page par page.',
        ], 410);
    }

    /**
     * Public free books are streamed once (PDF/EPUB) without PHP image rendering.
     * Paid or restricted books never reach this endpoint.
     *
     * A whole-document web reader cannot technically prevent a user from
     * extracting the bytes; paid titles still use the protected page reader.
     */
    public function free(Book $book, BookAccessService $access, FreeBookDocumentService $documents): StreamedResponse
    {
        abort_unless($access->isFreeTitle($book), 403, 'Ce livre n’est pas disponible en lecture gratuite.');

        $source = $documents->locate($book);

        return Storage::disk($source['disk'])->response(
            $source['path'],
            'lecture-holistique.'.$source['extension'],
            [
                'Content-Type' => $source['mime'],
                'Content-Disposition' => 'inline',
                'Cache-Control' => 'public, max-age=300, s-maxage=1800',
                'X-Content-Type-Options' => 'nosniff',
                'X-Holistique-Free-Reader' => '1',
            ],
            'inline',
        );
    }
}
