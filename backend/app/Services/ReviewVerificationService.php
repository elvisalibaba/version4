<?php

namespace App\Services;

use App\Models\Book;
use App\Models\Library;
use App\Models\Subscription;
use Illuminate\Support\Collection;

class ReviewVerificationService
{
    /**
     * @param Collection<int, string> $profileIds
     * @return array<int, string>
     */
    public function verifiedProfileIds(Book $book, Collection $profileIds): array
    {
        $ids = $profileIds
            ->filter(fn ($id): bool => is_string($id) && $id !== '')
            ->unique()
            ->values();

        if ($ids->isEmpty()) {
            return [];
        }

        $book->loadMissing(['subscriptionPlans:id']);

        $permanentIds = Library::query()
            ->where('book_id', $book->id)
            ->whereIn('user_id', $ids)
            ->where('status', 'active')
            ->whereIn('access_type', ['purchase', 'free'])
            ->where(fn ($query) => $query
                ->whereNull('expires_at')
                ->orWhere('expires_at', '>', now()))
            ->pluck('user_id');

        $planIds = $book->subscriptionPlans->modelKeys();
        $subscriptionIds = $planIds === []
            ? collect()
            : Subscription::query()
                ->currentlyActive()
                ->whereIn('user_id', $ids)
                ->whereIn('plan_id', $planIds)
                ->pluck('user_id');

        return $permanentIds
            ->merge($subscriptionIds)
            ->unique()
            ->values()
            ->all();
    }

    public function isVerified(Book $book, string $profileId): bool
    {
        return in_array(
            $profileId,
            $this->verifiedProfileIds($book, collect([$profileId])),
            true,
        );
    }
}
