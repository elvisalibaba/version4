<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PublishingReviewCase;
use App\Services\PlatformAuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthorReviewCaseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $profile = $this->author($request);

        $cases = PublishingReviewCase::query()
            ->where(function ($query) use ($profile): void {
                $query->where('author_id', $profile->id)
                    ->orWhereHas('book', fn ($book) => $book->where('author_id', $profile->id));
            })
            ->with('book:id,title')
            ->latest()
            ->paginate(min(100, max(1, (int) $request->integer('per_page', 25))));

        return response()->json($cases);
    }

    public function show(Request $request, PublishingReviewCase $reviewCase): JsonResponse
    {
        $profile = $this->author($request);
        $reviewCase->loadMissing('book:id,title,author_id');

        abort_unless(
            $reviewCase->author_id === $profile->id || $reviewCase->book?->author_id === $profile->id,
            404,
        );

        return response()->json(['data' => $reviewCase]);
    }

    public function appeal(
        Request $request,
        PublishingReviewCase $reviewCase,
        PlatformAuditService $audit,
    ): JsonResponse {
        $profile = $this->author($request);
        $reviewCase->loadMissing('book:id,title,author_id');

        abort_unless(
            $reviewCase->author_id === $profile->id || $reviewCase->book?->author_id === $profile->id,
            404,
        );

        abort_unless(in_array($reviewCase->status, ['rejected', 'author_action', 'resolved'], true), 422);

        $data = $request->validate([
            'author_response' => ['required', 'string', 'min:10', 'max:10000'],
        ]);

        $before = $reviewCase->only(['status', 'author_response']);

        $reviewCase->update([
            'author_response' => $data['author_response'],
            'status' => 'appealed',
        ]);

        $audit->record(
            action: 'publishing_review.appealed',
            entity: $reviewCase,
            actorId: $profile->id,
            before: $before,
            after: $reviewCase->only(['status', 'author_response']),
            summary: 'Recours soumis par l’auteur.',
            severity: 'warning',
        );

        return response()->json(['data' => $reviewCase->fresh()]);
    }

    private function author(Request $request)
    {
        $profile = $request->user()->profile;
        abort_unless($profile && in_array($profile->role, ['author', 'admin'], true), 403);

        return $profile;
    }
}
