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

        $book->loadMissing(['formats', 'subscriptionPlans:id']);

        if ($this->isFree($book)) {
            return $ids->all();
        }

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

    private function isFree(Book $book): bool
    {
        $preferredFormat = $book->formats
            ->where('is_published', true)
            ->whereIn('format', ['holistique_store', 'ebook'])
            ->sortBy(fn ($format): int => $format->format === 'holistique_store' ? 0 : 1)
            ->first();

        return $book->is_single_sale_enabled
            && (float) ($preferredFormat?->price ?? $book->price) <= 0;
    }
}
