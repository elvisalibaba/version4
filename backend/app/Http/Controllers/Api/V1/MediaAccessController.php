<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\MediaEdition;
use App\Services\BookAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MediaAccessController extends Controller
{
    public function access(Request $request, MediaEdition $mediaEdition, BookAccessService $access): JsonResponse
    {
        abort_unless($mediaEdition->status === 'published', 404);

        $profile = $request->user()->profile;
        abort_unless($profile !== null, 403);

        $mediaEdition->loadMissing(['book', 'chapters']);

        abort_unless($access->canRead($profile, $mediaEdition->book), 403, 'Accès média non autorisé.');

        $playbackUrl = null;
        $expiresInSeconds = null;

        if (filled($mediaEdition->storage_path)) {
            $playbackUrl = URL::temporarySignedRoute(
                'api.v1.media-editions.stream',
                now()->addMinutes(15),
                ['mediaEdition' => $mediaEdition->id],
            );
            $expiresInSeconds = 900;
        } elseif (filled($mediaEdition->streaming_url)) {
            // Compatibilité avec les anciens enregistrements externes.
            $playbackUrl = $mediaEdition->streaming_url;
        }

        $previewUrl = $this->resolvePreviewUrl($mediaEdition);

        return response()->json([
            'data' => [
                'id' => $mediaEdition->id,
                'book_id' => $mediaEdition->book_id,
                'media_type' => $mediaEdition->media_type,
                'title' => $mediaEdition->title,
                'language' => $mediaEdition->language,
                'duration_seconds' => $mediaEdition->duration_seconds,
                'narrator' => $mediaEdition->narrator,
                'presenter' => $mediaEdition->presenter,
                'playback_url' => $playbackUrl,
                'preview_url' => $previewUrl,
                'expires_in_seconds' => $expiresInSeconds,
                'chapters' => $mediaEdition->chapters->map(fn ($chapter): array => [
                    'id' => $chapter->id,
                    'position' => $chapter->position,
                    'title' => $chapter->title,
                    'starts_at_second' => $chapter->starts_at_second,
                    'ends_at_second' => $chapter->ends_at_second,
                    'is_preview' => $chapter->is_preview,
                ])->values(),
            ],
        ]);
    }

    public function stream(Request $request, MediaEdition $mediaEdition): StreamedResponse
    {
        abort_unless($mediaEdition->status === 'published' && filled($mediaEdition->storage_path), 404);

        return $this->streamPrivatePath(
            $request,
            (string) $mediaEdition->storage_path,
            $mediaEdition->mime_type,
        );
    }

    public function preview(Request $request, MediaEdition $mediaEdition): StreamedResponse
    {
        abort_unless($mediaEdition->status === 'published' && filled($mediaEdition->preview_url), 404);

        $path = (string) $mediaEdition->preview_url;

        abort_if(
            str_starts_with($path, 'http://') || str_starts_with($path, 'https://'),
            404,
        );

        return $this->streamPrivatePath($request, $path, null);
    }

    private function resolvePreviewUrl(MediaEdition $mediaEdition): ?string
    {
        if (blank($mediaEdition->preview_url)) {
            return null;
        }

        $preview = (string) $mediaEdition->preview_url;

        if (str_starts_with($preview, 'http://') || str_starts_with($preview, 'https://')) {
            return $preview;
        }

        return URL::temporarySignedRoute(
            'api.v1.media-editions.preview',
            now()->addMinutes(15),
            ['mediaEdition' => $mediaEdition->id],
        );
    }

    private function streamPrivatePath(Request $request, string $path, ?string $mimeType): StreamedResponse
    {
        $disk = Storage::disk('books');
        $path = ltrim($path, '/');

        abort_unless($disk->exists($path), 404);

        $size = $disk->size($path);
        $mime = $mimeType ?: $disk->mimeType($path) ?: 'application/octet-stream';
        $range = $request->header('Range');
        $start = 0;
        $end = max(0, $size - 1);
        $status = 200;

        if (is_string($range) && preg_match('/bytes=(\d*)-(\d*)/', $range, $matches)) {
            $requestedStart = $matches[1] !== '' ? (int) $matches[1] : 0;
            $requestedEnd = $matches[2] !== '' ? (int) $matches[2] : $end;

            $start = min(max(0, $requestedStart), $end);
            $end = min(max($start, $requestedEnd), $end);
            $status = 206;
        }

        $length = max(0, $end - $start + 1);

        $headers = [
            'Content-Type' => $mime,
            'Content-Length' => (string) $length,
            'Accept-Ranges' => 'bytes',
            'Cache-Control' => 'private, no-store, max-age=0',
            'X-Content-Type-Options' => 'nosniff',
        ];

        if ($status === 206) {
            $headers['Content-Range'] = "bytes {$start}-{$end}/{$size}";
        }

        return response()->stream(function () use ($disk, $path, $start, $length): void {
            $stream = $disk->readStream($path);
            abort_if($stream === false, 404);

            try {
                if ($start > 0) {
                    if (@fseek($stream, $start) !== 0) {
                        $remaining = $start;
                        while ($remaining > 0 && ! feof($stream)) {
                            $chunk = fread($stream, min(8192, $remaining));
                            if ($chunk === false || $chunk === '') {
                                break;
                            }
                            $remaining -= strlen($chunk);
                        }
                    }
                }

                $remaining = $length;
                while ($remaining > 0 && ! feof($stream)) {
                    $chunk = fread($stream, min(65536, $remaining));
                    if ($chunk === false || $chunk === '') {
                        break;
                    }

                    echo $chunk;
                    $remaining -= strlen($chunk);

                    if (function_exists('flush')) {
                        flush();
                    }
                }
            } finally {
                fclose($stream);
            }
        }, $status, $headers);
    }
}
