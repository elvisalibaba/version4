<?php

use App\Http\Controllers\Api\V1\AuthorController;
use App\Http\Controllers\Api\V1\AuthorDistributionController;
use App\Http\Controllers\Api\V1\AuthorFinanceController;
use App\Http\Controllers\Api\V1\AuthorWorkspaceController;
use App\Http\Controllers\Api\V1\AuthorReviewCaseController;
use App\Http\Controllers\Api\V1\AdController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BookAccessController;
use App\Http\Controllers\Api\V1\BookController;
use App\Http\Controllers\Api\V1\BookPricingController;
use App\Http\Controllers\Api\V1\EditorialTrainingController;
use App\Http\Controllers\Api\V1\EducationCatalogController;
use App\Http\Controllers\Api\V1\EngagementController;
use App\Http\Controllers\Api\V1\FavoriteController;
use App\Http\Controllers\Api\V1\HighlightController;
use App\Http\Controllers\Api\V1\LibraryController;
use App\Http\Controllers\Api\V1\MediaAccessController;
use App\Http\Controllers\Api\V1\MobileAppController;
use App\Http\Controllers\Api\V1\MobileDeviceController;
use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\PasswordController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\PublicContentController;
use App\Http\Controllers\Api\V1\PublicMediaController;
use App\Http\Controllers\Api\V1\PromotionEventController;
use App\Http\Controllers\Api\V1\ProtectedBookPageController;
use App\Http\Controllers\Api\V1\ReadController;
use App\Http\Controllers\Api\V1\ReaderDashboardController;
use App\Http\Controllers\Api\V1\ReviewController;
use App\Http\Controllers\Api\V1\ReadingProgressController;
use App\Http\Controllers\Api\V1\SubscriptionController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->name('api.v1.')->group(function (): void {
    Route::get('health', fn () => response()->json([
        'status' => 'ok',
        'service' => 'HolisticBooks API',
    ]))->name('health');

    Route::prefix('auth')->name('auth.')->group(function (): void {
        Route::post('register', [AuthController::class, 'register'])->name('register');
        Route::post('login', [AuthController::class, 'login'])->middleware('throttle:login')->name('login');
        Route::post('verify-email', [AuthController::class, 'verifyEmail'])->middleware('throttle:10,1')->name('verify-email');
        Route::get('verify-email-link/{user}', [AuthController::class, 'verifyEmailLink'])->middleware(['signed', 'throttle:10,1'])->name('verify-email-link');
        Route::post('resend-verification', [AuthController::class, 'resendVerification'])->middleware('throttle:3,1')->name('resend-verification');
        Route::post('forgot-password', [PasswordController::class, 'forgot'])->middleware('throttle:5,1')->name('forgot-password');
        Route::post('reset-password', [PasswordController::class, 'reset'])->middleware('throttle:5,1')->name('reset-password');
    });

    Route::apiResource('books', BookController::class)->only(['index', 'show']);
    Route::get('books/{book}/pricing', [BookPricingController::class, 'show'])->name('books.pricing');
    Route::get('education/catalog', [EducationCatalogController::class, 'index'])->name('education.catalog');
    Route::get('authors', [AuthorController::class, 'index'])->name('authors.index');
    Route::get('authors/{author}', [AuthorController::class, 'show'])->name('authors.show');
    Route::get('categories', [PublicContentController::class, 'categories'])->name('categories.index');
    Route::get('plans', [PublicContentController::class, 'plans'])->name('plans.index');
    Route::get('blog', [PublicContentController::class, 'blog'])->name('blog.index');
    Route::get('blog/{slug}', [PublicContentController::class, 'blogBySlug'])->name('blog.show');
    Route::get('home/featured', [PublicContentController::class, 'featured'])->name('home.featured');
    Route::get('media/{path}', [PublicMediaController::class, 'show'])->where('path', '.*')->name('media.show');
    Route::get('media-editions/{mediaEdition}/stream', [MediaAccessController::class, 'stream'])
        ->middleware(['signed', 'throttle:240,1'])
        ->name('media-editions.stream');
    Route::get('media-editions/{mediaEdition}/preview', [MediaAccessController::class, 'preview'])
        ->middleware(['signed', 'throttle:240,1'])
        ->name('media-editions.preview');
    Route::get('home/flash-sale', [PublicContentController::class, 'flashSale'])->name('home.flash-sale');
    Route::get('promotions', [PublicContentController::class, 'promotions'])->name('promotions.index');
    Route::post('promotions/{campaign}/events', [PromotionEventController::class, 'store'])->middleware('throttle:240,1')->name('promotions.events.store');
    Route::get('mobile', [PublicContentController::class, 'mobile'])->name('mobile.config');
    Route::get('mobile/download', [MobileAppController::class, 'download'])->name('mobile.download');
    Route::get('mobile/bootstrap', [MobileDeviceController::class, 'bootstrap'])->name('mobile.bootstrap');
    Route::get('ads/{placementCode}', [AdController::class, 'serve'])->middleware('throttle:120,1')->name('ads.serve');
    Route::post('ads/{assignment}/events', [AdController::class, 'track'])->middleware('throttle:240,1')->name('ads.track');
    Route::post('editorial-training', [EditorialTrainingController::class, 'store'])->middleware('throttle:20,1')->name('editorial-training.store');
    Route::post('payments/easypay/notify', [PaymentController::class, 'notify'])->middleware('throttle:120,1')->name('payments.easypay.notify');
    Route::post('books/{book}/engagement', [EngagementController::class, 'store'])->middleware('throttle:120,1')->name('books.engagement.store');
    Route::get('books/{book}/reviews', [ReviewController::class, 'index'])->middleware('throttle:120,1')->name('books.reviews.index');
    Route::get('books/{book}/read-free', [ReadController::class, 'free'])->middleware('throttle:120,1')->name('books.read-free');
    Route::get('books/{book}/preview/pages/{page}', [ProtectedBookPageController::class, 'preview'])->whereNumber('page')->middleware('throttle:120,1')->name('books.preview.page');

    Route::middleware(['auth:sanctum', 'verified'])->group(function (): void {
        Route::get('auth/me', [AuthController::class, 'me'])->name('auth.me');
        Route::post('auth/logout', [AuthController::class, 'logout'])->name('auth.logout');

        Route::apiResource('books', BookController::class)->only(['store', 'update', 'destroy']);
        Route::post('books/{book}', [BookController::class, 'update'])->name('books.update.multipart');
        Route::get('books/{book}/access', [BookAccessController::class, 'show'])->name('books.access');
        Route::post('books/{book}/reviews', [ReviewController::class, 'store'])->middleware('throttle:10,1')->name('books.reviews.store');
        Route::put('reviews/{rating}', [ReviewController::class, 'update'])->middleware('throttle:30,1')->name('reviews.update');
        Route::delete('reviews/{rating}', [ReviewController::class, 'destroy'])->middleware('throttle:30,1')->name('reviews.destroy');

        Route::get('library', [LibraryController::class, 'index'])->name('library.index');
        Route::get('favorites', [FavoriteController::class, 'index'])->name('favorites.index');
        Route::post('favorites/{book}', [FavoriteController::class, 'store'])->name('favorites.store');
        Route::delete('favorites/{book}', [FavoriteController::class, 'destroy'])->name('favorites.destroy');
        Route::apiResource('orders', OrderController::class)->only(['index', 'store', 'show']);
        Route::post('payments/easypay/init', [PaymentController::class, 'initialize'])->middleware('throttle:30,1')->name('payments.easypay.init');
        Route::post('payments/easypay/orders/{order}/reconcile', [PaymentController::class, 'reconcile'])->middleware('throttle:30,1')->name('payments.easypay.reconcile');
        Route::get('subscriptions', [SubscriptionController::class, 'index'])->name('subscriptions.index');
        Route::get('read/{book}', ReadController::class)->name('read');
        Route::get('read/{book}/pages/{page}', [ProtectedBookPageController::class, 'authenticated'])->whereNumber('page')->middleware('throttle:240,1')->name('read.page');
        Route::get('media-editions/{mediaEdition}/access', [MediaAccessController::class, 'access'])->name('media-editions.access');

        Route::post('mobile/trial/claim', [MobileAppController::class, 'claimTrial'])->name('mobile.trial.claim');
        Route::post('mobile/devices', [MobileDeviceController::class, 'upsertDevice'])->name('mobile.devices.upsert');
        Route::post('mobile/devices/{deviceUuid}/heartbeat', [MobileDeviceController::class, 'heartbeat'])->name('mobile.devices.heartbeat');
        Route::delete('mobile/devices/{deviceUuid}', [MobileDeviceController::class, 'revokeDevice'])->name('mobile.devices.revoke');
        Route::post('mobile/push-token', [MobileDeviceController::class, 'upsertPushToken'])->name('mobile.push-token.upsert');

        Route::get('reader/dashboard', [ReaderDashboardController::class, 'dashboard'])->name('reader.dashboard');
        Route::get('reader/affiliate', [ReaderDashboardController::class, 'affiliate'])->name('reader.affiliate');

        Route::get('author/dashboard', [AuthorWorkspaceController::class, 'dashboard'])->name('author.dashboard');
        Route::get('author/books', [AuthorWorkspaceController::class, 'books'])->name('author.books');
        Route::get('author/books/{book}', [AuthorWorkspaceController::class, 'book'])->name('author.books.show');
        Route::get('author/profile', [AuthorWorkspaceController::class, 'profileShow'])->name('author.profile.show');
        Route::post('author/profile', [AuthorWorkspaceController::class, 'profileUpdate'])->name('author.profile.update');
        Route::get('author/sales', [AuthorWorkspaceController::class, 'sales'])->name('author.sales');
        Route::get('author/review-cases', [AuthorReviewCaseController::class, 'index'])->name('author.review-cases.index');
        Route::get('author/review-cases/{reviewCase}', [AuthorReviewCaseController::class, 'show'])->name('author.review-cases.show');
        Route::post('author/review-cases/{reviewCase}/appeal', [AuthorReviewCaseController::class, 'appeal'])->middleware('throttle:10,1')->name('author.review-cases.appeal');

        Route::get('author/finance/summary', [AuthorFinanceController::class, 'summary'])->name('author.finance.summary');
        Route::get('author/finance/statement', [AuthorFinanceController::class, 'statement'])->name('author.finance.statement');
        Route::get('author/finance/royalties', [AuthorFinanceController::class, 'royalties'])->name('author.finance.royalties');
        Route::get('author/finance/payout-accounts', [AuthorFinanceController::class, 'payoutAccounts'])->name('author.finance.payout-accounts.index');
        Route::post('author/finance/payout-accounts', [AuthorFinanceController::class, 'storePayoutAccount'])->name('author.finance.payout-accounts.store');
        Route::put('author/finance/payout-accounts/{payoutAccount}', [AuthorFinanceController::class, 'updatePayoutAccount'])->name('author.finance.payout-accounts.update');
        Route::delete('author/finance/payout-accounts/{payoutAccount}', [AuthorFinanceController::class, 'destroyPayoutAccount'])->name('author.finance.payout-accounts.destroy');
        Route::get('author/finance/payouts', [AuthorFinanceController::class, 'payouts'])->name('author.finance.payouts.index');
        Route::post('author/finance/payouts', [AuthorFinanceController::class, 'requestPayout'])->name('author.finance.payouts.store');
        Route::get('author/books/{book}/distribution', [AuthorDistributionController::class, 'show'])->name('author.books.distribution.show');
        Route::put('author/books/{book}/distribution', [AuthorDistributionController::class, 'upsert'])->name('author.books.distribution.update');

        Route::get('books/{book}/progress', [ReadingProgressController::class, 'show'])->name('books.progress.show');
        Route::put('books/{book}/progress', [ReadingProgressController::class, 'update'])->name('books.progress.update');

        Route::get('books/{book}/highlights', [HighlightController::class, 'index'])->name('books.highlights.index');
        Route::post('books/{book}/highlights', [HighlightController::class, 'store'])->name('books.highlights.store');
        Route::put('highlights/{highlight}', [HighlightController::class, 'update'])->name('highlights.update');
        Route::delete('highlights/{highlight}', [HighlightController::class, 'destroy'])->name('highlights.destroy');
    });
});
