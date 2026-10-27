<?php

namespace App\Services;

use App\Models\Book;
use App\Models\Library;
use App\Models\Profile;
use App\Models\Subscription;

class BookAccessService
{
    /**
     * Pure access check for a public free-to-read title.
     * Never creates a Library row or a reader session for anonymous visitors.
     */
    public function isFreeTitle(Book $book): bool
    {
        if ($book->status !== 'published'
            || $book->copyright_status !== 'clear'
            || ! $book->can_read_on_platform
            || $book->reading_access_mode === 'preview_only'
            || ! $book->is_single_sale_enabled) {
            return false;
        }

        $book->loadMissing('formats');

        $preferredFormat = $book->formats
            ->where('is_published', true)
            ->whereIn('format', ['holistique_store', 'ebook'])
            ->sortBy(fn ($format): int => $format->format === 'holistique_store' ? 0 : 1)
            ->first();

        return (float) ($preferredFormat?->price ?? $book->price) <= 0;
    }

    public function canRead(Profile $profile, Book $book): bool
    {
        if ($book->status !== 'published' || $book->copyright_status !== 'clear') {
            return false;
        }

        $book->loadMissing('subscriptionPlans:id');

        $isFree = $this->isFreeTitle($book);

        $libraryEntry = Library::query()
            ->whereBelongsTo($profile, 'profile')
            ->whereBelongsTo($book)
            ->where('status', 'active')
            ->first();

        $hasPermanentAccess = in_array($libraryEntry?->access_type, ['purchase', 'free'], true)
            && ($libraryEntry?->expires_at === null || $libraryEntry->expires_at->isFuture());

        $activeSubscription = Subscription::query()
            ->currentlyActive()
            ->whereBelongsTo($profile, 'profile')
            ->whereIn('plan_id', $book->subscriptionPlans->modelKeys())
            ->latest('started_at')
            ->first();

        if (! $isFree && ! $hasPermanentAccess && $activeSubscription === null) {
            return false;
        }

        $accessType = $hasPermanentAccess ? $libraryEntry->access_type : ($isFree ? 'free' : 'subscription');
        $subscriptionId = $accessType === 'subscription' ? $activeSubscription?->id : null;

        Library::query()->updateOrCreate(
            ['user_id' => $profile->id, 'book_id' => $book->id],
            [
                'access_type' => $accessType,
                'subscription_id' => $subscriptionId,
                'status' => 'active',
                'purchased_at' => $libraryEntry?->purchased_at ?? now(),
                'last_opened_at' => now(),
            ],
        );

        return true;
    }
}
