<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\BookEngagementEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EngagementController extends Controller
{
    public function store(Request $request, Book $book): JsonResponse
    {
        abort_unless($book->status === 'published' && $book->copyright_status !== 'blocked', 404);

        $data = $request->validate([
            'event_type' => ['required', 'in:detail_view,reader_open,file_access'],
            'source' => ['nullable', 'string', 'max:255'],
            'metadata' => ['nullable', 'array'],
        ]);

        $user = $request->user();

        DB::transaction(function () use ($book, $data, $user): void {
            BookEngagementEvent::query()->create([
                'book_id' => $book->id,
                'user_id' => $user?->id,
                'event_type' => $data['event_type'],
                'source' => $data['source'] ?? null,
                'user_role' => $user?->profile?->role,
                'is_authenticated' => $user !== null,
                'metadata' => $data['metadata'] ?? [],
            ]);

            if ($data['event_type'] === 'detail_view') {
                Book::query()->whereKey($book->id)->increment('views_count');
            }
        });

        return response()->json(['message' => 'Événement enregistré.'], 201);
    }
}
