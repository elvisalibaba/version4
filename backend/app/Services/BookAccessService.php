<?php

namespace App\Services;

use App\Models\Book;
use App\Models\Library;
use App\Models\Profile;
use App\Models\Subscription;

class BookAccessService
{
    public function canRead(Profile $profile, Book $book): bool
    {
        if ($book->status !== 'published' || $book->copyright_status !== 'clear') {
            return false;
        }

        $book->loadMissing(['formats', 'subscriptionPlans:id']);

        $preferredFormat = $book->formats
            ->where('is_published', true)
            ->whereIn('format', ['holistique_store', 'ebook'])
            ->sortBy(fn ($format): int => $format->format === 'holistique_store' ? 0 : 1)
            ->first();

        $isFree = $book->is_single_sale_enabled && (float) ($preferredFormat?->price ?? $book->price) <= 0;

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
