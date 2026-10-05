<?php

namespace App\Providers;

use App\Models\User;
use App\Models\AuthorPayout;
use App\Models\Book;
use App\Models\BookMarketPrice;
use App\Models\Order;
use App\Models\PromotionCampaign;
use App\Models\PublishingReviewCase;
use App\Models\RightsContract;
use App\Observers\CriticalModelAuditObserver;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        foreach ([
            Book::class,
            RightsContract::class,
            PromotionCampaign::class,
            BookMarketPrice::class,
            PublishingReviewCase::class,
            AuthorPayout::class,
            Order::class,
        ] as $auditedModel) {
            $auditedModel::observe(CriticalModelAuditObserver::class);
        }

        RateLimiter::for('login', function (Request $request): Limit {
            return Limit::perMinute(5)->by(Str::lower($request->string('email')->toString()).'|'.$request->ip());
        });

        ResetPassword::createUrlUsing(function (User $user, string $token): string {
            $frontend = rtrim((string) config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000')), '/');

            return $frontend.'/reset-password?token='.urlencode($token).'&email='.urlencode($user->email);
        });
    }
}
