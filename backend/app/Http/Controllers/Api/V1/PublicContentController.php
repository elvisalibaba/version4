<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PublicBookResource;
use App\Models\BlogPost;
use App\Models\Book;
use App\Models\Category;
use App\Models\FlashSaleConfig;
use App\Models\HomeFeaturedConfig;
use App\Models\MobileAppConfig;
use App\Models\MobileAppVersion;
use App\Models\PromotionCampaign;
use App\Models\SubscriptionPlan;
use App\Support\PublicMediaUrl;
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
                ->get()
                ->map(fn (BlogPost $post): array => $this->serializeBlogPost($post))
                ->values(),
        ]);
    }

    public function blogPost(BlogPost $post): JsonResponse
    {
        return response()->json(['data' => $this->serializeBlogPost($post)]);
    }

    public function blogBySlug(string $slug): JsonResponse
    {
        $post = BlogPost::query()->where('slug', $slug)->firstOrFail();

        return response()->json([
            'data' => $this->serializeBlogPost($post),
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
            'data' => PublicBookResource::collection($books)->resolve(),
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
            'books' => PublicBookResource::collection($books)->resolve(),
        ]);
    }

    public function promotions(): JsonResponse
    {
        $campaigns = PromotionCampaign::query()
            ->where('is_active', true)
            ->where(fn ($query) => $query->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
            ->where(fn ($query) => $query->whereNull('ends_at')->orWhere('ends_at', '>=', now()))
            ->orderBy('priority')
            ->get();

        return response()->json([
            'data' => $campaigns->map(fn (PromotionCampaign $campaign): array => [
                'id' => $campaign->id,
                'name' => $campaign->name,
                'headline' => $campaign->headline,
                'description' => $campaign->description,
                'discount_type' => $campaign->discount_type,
                'discount_value' => $campaign->discount_value,
                'currency_code' => $campaign->currency_code,
                'selected_book_ids' => $campaign->selected_book_ids ?? [],
                'channels' => $campaign->channels ?? [],
                'starts_at' => $campaign->starts_at,
                'ends_at' => $campaign->ends_at,
            ])->values(),
        ]);
    }

    private function serializeBlogPost(BlogPost $post): array
    {
        $payload = $post->toArray();
        $payload['cover_image_url'] = PublicMediaUrl::resolve($post->cover_image_url);
        $payload['content_blocks'] = PublicMediaUrl::resolveContentBlocks($post->content_blocks ?? []);

        return $payload;
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
