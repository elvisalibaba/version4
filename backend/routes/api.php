<?php

use App\Http\Controllers\Api\V1\AuthorController;
use App\Http\Controllers\Api\V1\AuthorWorkspaceController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BookAccessController;
use App\Http\Controllers\Api\V1\BookController;
use App\Http\Controllers\Api\V1\EditorialTrainingController;
use App\Http\Controllers\Api\V1\EngagementController;
use App\Http\Controllers\Api\V1\FavoriteController;
use App\Http\Controllers\Api\V1\HighlightController;
use App\Http\Controllers\Api\V1\LibraryController;
use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\PasswordController;
use App\Http\Controllers\Api\V1\PublicContentController;
use App\Http\Controllers\Api\V1\ReadController;
use App\Http\Controllers\Api\V1\ReaderDashboardController;
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
        Route::post('forgot-password', [PasswordController::class, 'forgot'])->middleware('throttle:5,1')->name('forgot-password');
        Route::post('reset-password', [PasswordController::class, 'reset'])->middleware('throttle:5,1')->name('reset-password');
    });

    Route::apiResource('books', BookController::class)->only(['index', 'show']);
    Route::get('authors', [AuthorController::class, 'index'])->name('authors.index');
    Route::get('authors/{author}', [AuthorController::class, 'show'])->name('authors.show');
    Route::get('categories', [PublicContentController::class, 'categories'])->name('categories.index');
    Route::get('plans', [PublicContentController::class, 'plans'])->name('plans.index');
    Route::get('blog', [PublicContentController::class, 'blog'])->name('blog.index');
    Route::get('blog/{slug}', [PublicContentController::class, 'blogBySlug'])->name('blog.show');
    Route::get('home/featured', [PublicContentController::class, 'featured'])->name('home.featured');
    Route::get('home/flash-sale', [PublicContentController::class, 'flashSale'])->name('home.flash-sale');
    Route::get('mobile', [PublicContentController::class, 'mobile'])->name('mobile.config');
    Route::post('editorial-training', [EditorialTrainingController::class, 'store'])->middleware('throttle:20,1')->name('editorial-training.store');
    Route::post('books/{book}/engagement', [EngagementController::class, 'store'])->middleware('throttle:120,1')->name('books.engagement.store');

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('auth/me', [AuthController::class, 'me'])->name('auth.me');
        Route::post('auth/logout', [AuthController::class, 'logout'])->name('auth.logout');

        Route::apiResource('books', BookController::class)->only(['store', 'update', 'destroy']);
        Route::post('books/{book}', [BookController::class, 'update'])->name('books.update.multipart');
        Route::get('books/{book}/access', [BookAccessController::class, 'show'])->name('books.access');

        Route::get('library', [LibraryController::class, 'index'])->name('library.index');
        Route::get('favorites', [FavoriteController::class, 'index'])->name('favorites.index');
        Route::post('favorites/{book}', [FavoriteController::class, 'store'])->name('favorites.store');
        Route::delete('favorites/{book}', [FavoriteController::class, 'destroy'])->name('favorites.destroy');
        Route::apiResource('orders', OrderController::class)->only(['index', 'store', 'show']);
        Route::get('subscriptions', [SubscriptionController::class, 'index'])->name('subscriptions.index');
        Route::get('read/{book}', ReadController::class)->name('read');

        Route::get('reader/dashboard', [ReaderDashboardController::class, 'dashboard'])->name('reader.dashboard');
        Route::get('reader/affiliate', [ReaderDashboardController::class, 'affiliate'])->name('reader.affiliate');

        Route::get('author/dashboard', [AuthorWorkspaceController::class, 'dashboard'])->name('author.dashboard');
        Route::get('author/books', [AuthorWorkspaceController::class, 'books'])->name('author.books');
        Route::get('author/profile', [AuthorWorkspaceController::class, 'profileShow'])->name('author.profile.show');
        Route::post('author/profile', [AuthorWorkspaceController::class, 'profileUpdate'])->name('author.profile.update');
        Route::get('author/sales', [AuthorWorkspaceController::class, 'sales'])->name('author.sales');

        Route::get('books/{book}/progress', [ReadingProgressController::class, 'show'])->name('books.progress.show');
        Route::put('books/{book}/progress', [ReadingProgressController::class, 'update'])->name('books.progress.update');

        Route::get('books/{book}/highlights', [HighlightController::class, 'index'])->name('books.highlights.index');
        Route::post('books/{book}/highlights', [HighlightController::class, 'store'])->name('books.highlights.store');
        Route::put('highlights/{highlight}', [HighlightController::class, 'update'])->name('highlights.update');
        Route::delete('highlights/{highlight}', [HighlightController::class, 'destroy'])->name('highlights.destroy');
    });
});
