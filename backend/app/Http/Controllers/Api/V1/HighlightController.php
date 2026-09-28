<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Reader\StoreHighlightRequest;
use App\Models\Book;
use App\Models\Highlight;
use App\Services\BookAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class HighlightController extends Controller
{
    public function index(Request $request, Book $book, BookAccessService $access): JsonResponse
    {
        $profile = $request->user()->profile;
        abort_unless($profile && $access->canRead($profile, $book), 403, 'Accès au livre refusé.');

        $highlights = Highlight::query()
            ->where('user_id', $profile->id)
            ->where('book_id', $book->id)
            ->orderBy('created_at')
            ->get();

        return response()->json(['data' => $highlights]);
    }

    public function store(StoreHighlightRequest $request, Book $book, BookAccessService $access): JsonResponse
    {
        $profile = $request->user()->profile;
        abort_unless($profile && $access->canRead($profile, $book), 403, 'Accès au livre refusé.');

        $data = $request->validated();

        if (! empty($data['device_record_id'])) {
            abort_unless(
                $profile->devices()->whereKey($data['device_record_id'])->exists(),
                422,
                'Cet appareil n’appartient pas à l’utilisateur authentifié.'
            );
        }

        $highlight = Highlight::query()->create([
            ...$data,
            'user_id' => $profile->id,
            'book_id' => $book->id,
        ]);

        return response()->json(['data' => $highlight], 201);
    }

    public function update(StoreHighlightRequest $request, Highlight $highlight): JsonResponse
    {
        $profile = $request->user()->profile;
        abort_unless($profile && $highlight->user_id === $profile->id, 404);

        $data = $request->validated();

        if (! empty($data['device_record_id'])) {
            abort_unless(
                $profile->devices()->whereKey($data['device_record_id'])->exists(),
                422,
                'Cet appareil n’appartient pas à l’utilisateur authentifié.'
            );
        }

        $highlight->update($data);

        return response()->json(['data' => $highlight->fresh()]);
    }

    public function destroy(Request $request, Highlight $highlight): Response
    {
        $profile = $request->user()->profile;
        abort_unless($profile && $highlight->user_id === $profile->id, 404);

        $highlight->delete();

        return response()->noContent();
    }
}
