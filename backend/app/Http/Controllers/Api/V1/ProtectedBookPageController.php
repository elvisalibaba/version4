<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Services\BookAccessService;
use App\Services\ProtectedPdfPageService;
use App\Services\ProtectedReaderSessionService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProtectedBookPageController extends Controller
{
    public function authenticated(
        Request $request,
        Book $book,
        int $page,
        BookAccessService $access,
        ProtectedReaderSessionService $readerSessions,
        ProtectedPdfPageService $pages,
    ): StreamedResponse {
        $profile = $request->user()->profile;

        abort_unless($profile !== null && $access->canRead($profile, $book), 403, 'Accès de lecture refusé.');
        abort_unless($book->can_read_on_platform, 403, 'Lecture non autorisée par la licence.');
        abort_if($book->reading_access_mode === 'preview_only', 403, 'Ce titre est limité à un aperçu.');

        $readerSessions->validate($request, $profile, $book);

        return $this->streamPage($pages->renderBookPage($book, $page), false, $profile->id, $book->id, $page);
    }

    public function preview(Book $book, int $page, ProtectedPdfPageService $pages): StreamedResponse
    {
        abort_unless(
            $book->status === 'published'
                && $book->copyright_status === 'clear'
                && $book->can_read_on_platform,
            403,
            'Aperçu non disponible.',
        );

        return $this->streamPage($pages->renderPreviewPage($book, $page), true, null, $book->id, $page);
    }

    /**
     * @param array{disk:string,path:string,mime:string} $rendered
     */
    private function streamPage(array $rendered, bool $preview, ?string $profileId, string $bookId, int $page): StreamedResponse
    {
        $disk = \Illuminate\Support\Facades\Storage::disk($rendered['disk']);
        $stream = $disk->readStream($rendered['path']);

        abort_if($stream === false, 404, 'Page rendue introuvable.');

        return response()->stream(function () use ($stream): void {
            fpassthru($stream);
            fclose($stream);
        }, 200, [
            'Content-Type' => $rendered['mime'],
            'Content-Disposition' => 'inline; filename="page-'.$page.'.jpg"',
            'Cache-Control' => 'private, no-store, no-cache, must-revalidate',
            'Pragma' => 'no-cache',
            'X-Content-Type-Options' => 'nosniff',
            'X-Frame-Options' => 'SAMEORIGIN',
            'Referrer-Policy' => 'no-referrer',
            'Cross-Origin-Resource-Policy' => 'same-site',
            'X-Holistique-Preview-Only' => $preview ? '1' : '0',
            'X-Holistique-Download-Allowed' => '0',
            'X-Holistique-Book' => $bookId,
            'X-Holistique-Page' => (string) $page,
            'X-Holistique-Reader' => $profileId ?? 'guest',
        ]);
    }
}
