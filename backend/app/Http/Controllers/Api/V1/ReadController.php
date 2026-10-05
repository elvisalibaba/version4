<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Services\BookAccessService;
use App\Services\PrivateBookFileService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReadController extends Controller
{
    public function __invoke(Request $request, Book $book, BookAccessService $access, PrivateBookFileService $files): StreamedResponse
    {
        abort_unless($access->canRead($request->user()->profile, $book), 403, 'Vous ne disposez pas d’un accès actif à ce livre.');
        abort_unless($book->can_read_on_platform, 403, 'La licence de ce titre n’autorise pas la lecture sur Holistique Books.');
        abort_if($book->reading_access_mode === 'preview_only', 403, 'Ce titre est limité à un aperçu et ne peut pas ouvrir le manuscrit complet.');

        return $files->stream($book);
    }

    public function free(Book $book, PrivateBookFileService $files): StreamedResponse
    {
        abort_unless(
            $book->status === 'published'
                && $book->copyright_status === 'clear'
                && $book->can_read_on_platform
                && $book->reading_access_mode !== 'preview_only'
                && $book->is_single_sale_enabled
                && (float) $book->price <= 0,
            403,
            'Ce livre n’est pas disponible en lecture gratuite.',
        );

        return $files->stream($book);
    }
}
