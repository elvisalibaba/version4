<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\Library;
use App\Models\Subscription;
use App\Services\BookAccessService;
use App\Services\ProtectedReaderSessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookAccessController extends Controller
{
    public function show(Request $request, Book $book, BookAccessService $access, ProtectedReaderSessionService $readerSessions): JsonResponse
    {
        $profile = $request->user()->profile;
        abort_unless($profile !== null, 403);

        $hasAccess = $access->canRead($profile, $book);

        $libraryEntry = Library::query()
            ->where('user_id', $profile->id)
            ->where('book_id', $book->id)
            ->with('subscription.plan')
            ->first();

        $book->loadMissing('subscriptionPlans:id,name,slug,monthly_price,currency_code');

        $activeSubscription = Subscription::query()
            ->currentlyActive()
            ->where('user_id', $profile->id)
            ->whereIn('plan_id', $book->subscriptionPlans->modelKeys())
            ->with('plan')
            ->latest('started_at')
            ->first();

        $hasPurchaseAccess = in_array($libraryEntry?->access_type, ['purchase', 'free'], true)
            && $libraryEntry?->status === 'active'
            && ($libraryEntry?->expires_at === null || $libraryEntry->expires_at->isFuture());

        $hasSubscriptionAccess = $activeSubscription !== null;

        $readerSession = null;
        if ($hasAccess && $book->can_read_on_platform && $book->reading_access_mode !== 'preview_only') {
            $readerSession = $readerSessions->issue($profile, $book, $request);
        }

        $isSubscriptionEntitlementExpired = $libraryEntry?->access_type === 'subscription'
            && $libraryEntry?->subscription !== null
            && ! (
                $libraryEntry->subscription->status === 'active'
                && ($libraryEntry->subscription->expires_at === null || $libraryEntry->subscription->expires_at->isFuture())
            );

        return response()->json([
            'data' => [
                'hasAccess' => $hasAccess && $book->can_read_on_platform,
                'readerPermissions' => array_merge($book->readerPermissions(), ['can_download' => false]),
                'rightsAgreementReference' => $book->rights_agreement_reference,
                'readerSession' => $readerSession,
                'hasPurchaseAccess' => $hasPurchaseAccess,
                'hasSubscriptionAccess' => $hasSubscriptionAccess,
                'hasLibraryEntry' => $libraryEntry !== null,
                'libraryEntry' => $libraryEntry ? [
                    'id' => $libraryEntry->id,
                    'purchased_at' => $libraryEntry->purchased_at,
                    'access_type' => $libraryEntry->access_type,
                    'subscription_id' => $libraryEntry->subscription_id,
                    'user_subscriptions' => $libraryEntry->subscription ? [
                        'id' => $libraryEntry->subscription->id,
                        'plan_id' => $libraryEntry->subscription->plan_id,
                        'status' => $libraryEntry->subscription->status,
                        'expires_at' => $libraryEntry->subscription->expires_at,
                        'started_at' => $libraryEntry->subscription->started_at,
                        'subscription_plans' => $libraryEntry->subscription->plan,
                    ] : null,
                ] : null,
                'activeSubscription' => $activeSubscription ? [
                    'id' => $activeSubscription->id,
                    'plan_id' => $activeSubscription->plan_id,
                    'status' => $activeSubscription->status,
                    'expires_at' => $activeSubscription->expires_at,
                    'started_at' => $activeSubscription->started_at,
                    'subscription_plans' => $activeSubscription->plan,
                ] : null,
                'isSubscriptionEntitlementExpired' => $isSubscriptionEntitlementExpired,
            ],
        ]);
    }
}
