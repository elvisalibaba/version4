<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PublicMediaController extends Controller
{
    public function show(Request $request, string $path): StreamedResponse
    {
        $normalized = ltrim(str_replace('\\', '/', $path), '/');

        abort_if(
            $normalized === '' ||
            str_contains($normalized, '../') ||
            str_contains($normalized, '/..') ||
            str_starts_with($normalized, '.'),
            404
        );

        $disk = Storage::disk('public');
        abort_unless($disk->exists($normalized), 404);

        $response = $disk->response($normalized, null, [
            'Cache-Control' => 'public, max-age=86400, stale-while-revalidate=604800',
            'X-Content-Type-Options' => 'nosniff',
        ]);

        return $response;
    }
}
