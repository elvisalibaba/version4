<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Review\IndexBookReviewsRequest;
use App\Http\Requests\Review\StoreBookReviewRequest;
use App\Http\Requests\Review\UpdateBookReviewRequest;
use App\Http\Resources\ReviewResource;
use App\Models\Book;
use App\Models\Rating;
use App\Services\ReviewVerificationService;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class ReviewController extends Controller
{
    private const DUPLICATE_MESSAGE = 'Vous avez déjà publié un avis pour ce livre.';

    private const OWN_BOOK_MESSAGE = 'Vous ne pouvez pas noter votre propre livre.';

    public function index(
        IndexBookReviewsRequest $request,
        Book $book,
        ReviewVerificationService $verification,
    ): AnonymousResourceCollection {
        $this->assertPublicBook($book);

        $sort = $request->string('sort')->toString() ?: 'recent';
        $perPage = (int) ($request->validated('per_page') ?? 12);

        $query = Rating::query()
            ->visible()
            ->where('book_id', $book->id)
            ->with('profile:id,name,first_name,last_name');

        if ($sort === 'helpful') {
            $query->orderByDesc('helpful_count')->orderByDesc('created_at');
        } else {
            $query->latest('created_at');
        }

        $reviews = $query->paginate($perPage)->withQueryString();
        $items = collect($reviews->items());
        $verifiedIds = collect($verification->verifiedProfileIds($book, $items->pluck('user_id')))
            ->flip();

        $currentProfileId = $request->user('sanctum')?->profile?->id;

        $items->each(function (Rating $rating) use ($verifiedIds, $currentProfileId): void {
            $rating->setAttribute('verified_purchase', $verifiedIds->has($rating->user_id));
            $rating->setAttribute('is_mine', $currentProfileId !== null && $rating->user_id === $currentProfileId);
        });

        $currentReview = null;
        if ($currentProfileId !== null) {
            $currentReview = Rating::query()
                ->where('book_id', $book->id)
                ->where('user_id', $currentProfileId)
                ->with('profile:id,name,first_name,last_name')
                ->first();

            if ($currentReview !== null) {
                $currentReview->setAttribute(
                    'verified_purchase',
                    $verification->isVerified($book, $currentProfileId),
                );
                $currentReview->setAttribute('is_mine', true);
            }
        }

        $summary = Rating::query()
            ->visible()
            ->where('book_id', $book->id)
            ->selectRaw('COUNT(*) as reviews_count, AVG(rating) as rating_avg')
            ->first();

        return ReviewResource::collection($reviews)->additional([
            'summary' => [
                'rating_avg' => $summary?->rating_avg !== null ? (float) $summary->rating_avg : null,
                'reviews_count' => (int) ($summary?->reviews_count ?? 0),
            ],
            'current_user_review' => $currentReview
                ? (new ReviewResource($currentReview))->resolve($request)
                : null,
            'can_review' => $currentProfileId === null
                ? null
                : ! $this->isOwnBook($book, $currentProfileId),
        ]);
    }

    public function store(
        StoreBookReviewRequest $request,
        Book $book,
        ReviewVerificationService $verification,
    ): JsonResponse {
        $this->assertPublicBook($book);
        $profile = $request->user()->profile;
        abort_unless($profile !== null, 403);

        abort_if($this->isOwnBook($book, $profile->id), 403, self::OWN_BOOK_MESSAGE);

        if (Rating::query()->where('user_id', $profile->id)->where('book_id', $book->id)->exists()) {
            throw ValidationException::withMessages([
                'rating' => self::DUPLICATE_MESSAGE,
            ]);
        }

        try {
            $rating = Rating::query()->create([
                'user_id' => $profile->id,
                'book_id' => $book->id,
                'rating' => $request->integer('rating'),
                'review_text' => $request->validated('text'),
            ]);
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages([
                'rating' => self::DUPLICATE_MESSAGE,
            ]);
        }

        $rating->load('profile:id,name,first_name,last_name');

        $rating->setAttribute('verified_purchase', $verification->isVerified($book, $profile->id));
        $rating->setAttribute('is_mine', true);

        return (new ReviewResource($rating))
            ->response()
            ->setStatusCode(201);
    }

    public function update(
        UpdateBookReviewRequest $request,
        Rating $rating,
        ReviewVerificationService $verification,
    ): ReviewResource {
        Gate::authorize('update', $rating);

        $rating->update([
            'rating' => $request->integer('rating'),
            'review_text' => $request->validated('text'),
        ]);

        $rating->load(['profile:id,name,first_name,last_name', 'book.formats', 'book.subscriptionPlans:id']);
        $rating->setAttribute(
            'verified_purchase',
            $verification->isVerified($rating->book, $rating->user_id),
        );
        $rating->setAttribute('is_mine', true);

        return new ReviewResource($rating);
    }

    public function destroy(Rating $rating): Response
    {
        Gate::authorize('delete', $rating);
        $rating->delete();

        return response()->noContent();
    }

    private function assertPublicBook(Book $book): void
    {
        abort_unless(
            $book->status === 'published' && $book->copyright_status === 'clear',
            404,
        );
    }

    private function isOwnBook(Book $book, string $profileId): bool
    {
        if ($book->author_id === $profileId) {
            return true;
        }

        return DB::table('book_authors')
            ->where('book_id', $book->id)
            ->where('author_id', $profileId)
            ->exists();
    }
}
