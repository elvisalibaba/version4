<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\BookEngagementEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EngagementController extends Controller
{
    public function store(Request $request, Book $book): JsonResponse
    {
        abort_unless($book->status === 'published' && $book->copyright_status !== 'blocked', 404);

        $data = $request->validate([
            'event_type' => ['required', 'in:detail_view,catalog_click,reader_open,file_access'],
            'source' => ['nullable', 'string', 'max:255'],
            'visitor_id' => ['nullable', 'uuid'],
            'metadata' => ['nullable', 'array', 'max:20'],
        ]);

        $user = $request->user('sanctum') ?? $request->user();
        $deduplicationKey = $this->deduplicationKey($request, $book, $data['event_type'], $user?->id, $data['visitor_id'] ?? null);

        $recorded = DB::transaction(function () use ($book, $data, $user, $deduplicationKey): bool {
            $inserted = DB::table((new BookEngagementEvent)->getTable())->insertOrIgnore([
                'id' => (string) Str::uuid(),
                'book_id' => $book->id,
                'user_id' => $user?->profile?->id,
                'event_type' => $data['event_type'],
                'source' => $data['source'] ?? null,
                'user_role' => $user?->profile?->role,
                'is_authenticated' => $user !== null,
                'metadata' => json_encode($data['metadata'] ?? [], JSON_THROW_ON_ERROR),
                'deduplication_key' => $deduplicationKey,
                'created_at' => now(),
            ]);

            if ($inserted === 0) {
                return false;
            }

            if ($data['event_type'] === 'detail_view') {
                Book::query()->whereKey($book->id)->increment('views_count');
            }

            if ($data['event_type'] === 'catalog_click') {
                Book::query()->whereKey($book->id)->increment('clicks_count');
            }

            return true;
        });

        return response()->json([
            'message' => $recorded ? 'Événement enregistré.' : 'Événement déjà comptabilisé.',
            'recorded' => $recorded,
        ], $recorded ? 201 : 200);
    }

    private function deduplicationKey(Request $request, Book $book, string $eventType, ?string $userId, ?string $visitorId): string
    {
        $identity = $userId === null
            ? implode('|', [$request->ip(), mb_substr((string) $request->userAgent(), 0, 255), $visitorId])
            : 'user:'.$userId;

        $hours = max(1, (int) config('books.engagement_deduplication_hours', 24));
        $bucket = intdiv(now()->getTimestamp(), $hours * 3600);
        $visitorHash = hash_hmac('sha256', $identity, (string) config('app.key'));

        return hash('sha256', implode('|', [$book->id, $eventType, $visitorHash, $bucket]));
    }
}
