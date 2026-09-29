<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\BookResource;
use App\Models\BlogPost;
use App\Models\Book;
use App\Models\Category;
use App\Models\FlashSaleConfig;
use App\Models\HomeFeaturedConfig;
use App\Models\MobileAppConfig;
use App\Models\MobileAppVersion;
use App\Models\SubscriptionPlan;
use Illuminate\Http\JsonResponse;

class PublicContentController extends Controller
{
    public function categories(): JsonResponse
    {
        return response()->json([
            'data' => Category::query()
                ->where('is_active', true)
                ->withCount('books')
                ->orderByDesc('is_featured')
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function plans(): JsonResponse
    {
        return response()->json([
            'data' => SubscriptionPlan::query()
                ->where('is_active', true)
                ->withCount('books')
                ->orderBy('monthly_price')
                ->get(),
        ]);
    }

    public function blog(): JsonResponse
    {
        return response()->json([
            'data' => BlogPost::query()
                ->orderByDesc('published_at')
                ->orderByDesc('created_at')
                ->get(),
        ]);
    }

    public function blogPost(BlogPost $post): JsonResponse
    {
        return response()->json(['data' => $post]);
    }

    public function blogBySlug(string $slug): JsonResponse
    {
        return response()->json([
            'data' => BlogPost::query()->where('slug', $slug)->firstOrFail(),
        ]);
    }

    public function featured(): JsonResponse
    {
        $config = HomeFeaturedConfig::query()->find('global');
        $ids = $config?->selected_book_ids ?? [];

        $books = Book::query()
            ->publiclyAvailable()
            ->where('status', 'published')
            ->whereIn('id', $ids)
            ->with(['author', 'formats'])
            ->get()
            ->sortBy(fn (Book $book): int => array_search($book->id, $ids, true) ?: 0)
            ->values();

        return response()->json([
            'data' => BookResource::collection($books)->resolve(),
            'selected_book_ids' => $ids,
        ]);
    }

    public function flashSale(): JsonResponse
    {
        $config = FlashSaleConfig::query()->find('global');
        $ids = $config?->selected_book_ids ?? [];

        $books = Book::query()
            ->publiclyAvailable()
            ->where('status', 'published')
            ->whereIn('id', $ids)
            ->with(['author', 'formats'])
            ->get();

        return response()->json([
            'discount_percentage' => $config?->discount_percentage ?? 20,
            'selected_book_ids' => $ids,
            'books' => BookResource::collection($books)->resolve(),
        ]);
    }

    public function mobile(): JsonResponse
    {
        $config = MobileAppConfig::query()->find('global');
        $version = MobileAppVersion::query()
            ->where('platform', 'android')
            ->where('is_published', true)
            ->latest('published_at')
            ->first();

        return response()->json([
            'data' => [
                'config' => $config,
                'current_version' => $version,
            ],
        ]);
    }
}
