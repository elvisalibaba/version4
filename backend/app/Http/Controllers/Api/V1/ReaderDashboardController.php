<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\BookResource;
use App\Http\Resources\LibraryResource;
use App\Http\Resources\OrderResource;
use App\Http\Resources\SubscriptionResource;
use App\Models\AffiliateCommission;
use App\Models\AffiliateOrderCommission;
use App\Models\AffiliatePayoutAccount;
use App\Models\AffiliateWallet;
use App\Models\Favorite;
use App\Models\Library;
use App\Models\Order;
use App\Models\ReadingProgress;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ReaderDashboardController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $profile = $request->user()->profile;
        abort_unless($profile !== null, 403);

        $library = Library::query()
            ->where('user_id', $profile->id)
            ->where('status', 'active')
            ->with(['book.author', 'book.formats', 'subscription.plan'])
            ->latest('last_opened_at')
            ->limit(6)
            ->get();

        $progressByBook = ReadingProgress::query()
            ->where('user_id', $profile->id)
            ->whereIn('book_id', $library->pluck('book_id'))
            ->latest('updated_at')
            ->get()
            ->unique('book_id')
            ->keyBy('book_id');

        $library->each(function (Library $entry) use ($progressByBook): void {
            $progress = $progressByBook->get($entry->book_id);
            $entry->setAttribute('reading_progress_snapshot', $progress ? [
                'locator' => $progress->locator,
                'locator_type' => $progress->locator_type,
                'progress_percent' => (float) $progress->progress_percent,
                'updated_at' => $progress->updated_at?->toIso8601String(),
            ] : null);
        });

        $orders = Order::query()
            ->where('user_id', $profile->id)
            ->with(['items.book', 'items.format'])
            ->latest()
            ->limit(5)
            ->get();

        $subscriptions = Subscription::query()
            ->where('user_id', $profile->id)
            ->with('plan')
            ->latest('started_at')
            ->get();

        return response()->json([
            'data' => [
                'stats' => [
                    'library' => Library::query()->where('user_id', $profile->id)->where('status', 'active')->count(),
                    'favorites' => Favorite::query()->where('user_id', $profile->id)->count(),
                    'orders' => Order::query()->where('user_id', $profile->id)->count(),
                    'active_subscriptions' => Subscription::query()->currentlyActive()->where('user_id', $profile->id)->count(),
                ],
                'library' => LibraryResource::collection($library)->resolve(),
                'orders' => OrderResource::collection($orders)->resolve(),
                'subscriptions' => SubscriptionResource::collection($subscriptions)->resolve(),
            ],
        ]);
    }

    public function affiliate(Request $request): JsonResponse
    {
        $profile = $request->user()->profile;
        abort_unless($profile !== null, 403);

        $wallet = AffiliateWallet::query()->firstOrCreate(
            ['user_id' => $profile->id],
            [
                'affiliate_code' => Str::upper(Str::random(10)),
                'commission_rate' => 0.0200,
                'wallet_balance' => 0,
                'lifetime_credited' => 0,
                'currency_code' => 'USD',
                'is_active' => true,
            ],
        );

        return response()->json([
            'data' => [
                'wallet' => $wallet,
                'subscription_commissions' => AffiliateCommission::query()
                    ->where('affiliate_user_id', $profile->id)
                    ->latest()
                    ->limit(50)
                    ->get(),
                'order_commissions' => AffiliateOrderCommission::query()
                    ->where('affiliate_user_id', $profile->id)
                    ->latest()
                    ->limit(50)
                    ->get(),
                'payout_accounts' => AffiliatePayoutAccount::query()
                    ->where('user_id', $profile->id)
                    ->latest()
                    ->get(),
            ],
        ]);
    }
}
