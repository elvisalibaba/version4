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
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request, Book $book, BookAccessService $access, PrivateBookFileService $files): StreamedResponse
    {
        abort_unless($access->canRead($request->user()->profile, $book), 403, 'Vous ne disposez pas d’un accès actif à ce livre.');

        return $files->stream($book);
    }
}
