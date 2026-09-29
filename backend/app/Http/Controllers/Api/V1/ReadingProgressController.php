<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Reader\UpsertReadingProgressRequest;
use App\Models\Book;
use App\Models\ReadingProgress;
use App\Models\Library;
use App\Services\BookAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReadingProgressController extends Controller
{
    public function show(Request $request, Book $book, BookAccessService $access): JsonResponse
    {
        $profile = $request->user()->profile;
        abort_unless($profile && $access->canRead($profile, $book), 403, 'Accès au livre refusé.');

        $progress = ReadingProgress::query()
            ->where('user_id', $profile->id)
            ->where('book_id', $book->id)
            ->latest('updated_at')
            ->first();

        return response()->json(['data' => $progress]);
    }

    public function update(UpsertReadingProgressRequest $request, Book $book, BookAccessService $access): JsonResponse
    {
        $profile = $request->user()->profile;
        abort_unless($profile && $access->canRead($profile, $book), 403, 'Accès au livre refusé.');

        $data = $request->validated();

        if (! empty($data['format_id'])) {
            abort_unless(
                $book->formats()->whereKey($data['format_id'])->exists(),
                422,
                'Le format sélectionné ne correspond pas à ce livre.'
            );
        }

        if (! empty($data['device_record_id'])) {
            abort_unless(
                $profile->devices()->whereKey($data['device_record_id'])->exists(),
                422,
                'Cet appareil n’appartient pas à l’utilisateur authentifié.'
            );
        }

        $query = ReadingProgress::query()
            ->where('user_id', $profile->id)
            ->where('book_id', $book->id);

        array_key_exists('format_id', $data) && $data['format_id'] !== null
            ? $query->where('format_id', $data['format_id'])
            : $query->whereNull('format_id');

        $progress = $query->first() ?? new ReadingProgress([
            'user_id' => $profile->id,
            'book_id' => $book->id,
            'format_id' => $data['format_id'] ?? null,
        ]);

        $progress->fill($data);
        $progress->sync_revision = max(1, (int) $progress->sync_revision + ($progress->exists ? 1 : 0));
        $progress->save();

        Library::query()
            ->where('user_id', $profile->id)
            ->where('book_id', $book->id)
            ->where('status', 'active')
            ->update([
                'last_opened_at' => now(),
                'last_synced_at' => now(),
            ]);

        return response()->json(['data' => $progress->fresh()], $progress->wasRecentlyCreated ? 201 : 200);
    }
}
