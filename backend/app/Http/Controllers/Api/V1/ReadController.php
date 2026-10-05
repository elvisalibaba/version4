<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Services\BookAccessService;
use App\Services\PrivateBookFileService;
use App\Services\ProtectedReaderSessionService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReadController extends Controller
{
    public function __invoke(
        Request $request,
        Book $book,
        BookAccessService $access,
        PrivateBookFileService $files,
        ProtectedReaderSessionService $readerSessions,
    ): StreamedResponse {
        $profile = $request->user()->profile;
        abort_unless($profile !== null && $access->canRead($profile, $book), 403, 'Vous ne disposez pas d’un accès actif à ce livre.');
        abort_unless($book->can_read_on_platform, 403, 'La licence de ce titre n’autorise pas la lecture sur Holistique Books.');
        abort_if($book->reading_access_mode === 'preview_only', 403, 'Ce titre est limité à un aperçu et ne peut pas ouvrir le manuscrit complet.');

        $session = $readerSessions->validate($request, $profile, $book);

        return $files->stream($book, $session?->id);
    }

    public function free(Book $book, PrivateBookFileService $files): StreamedResponse
    {
        abort_unless(
            $book->status === 'published'
                && $book->copyright_status === 'clear'
                && $book->can_read_on_platform,
            403,
            'Ce livre n’est pas disponible en aperçu public.',
        );

        return $files->streamSample($book);
    }
}
