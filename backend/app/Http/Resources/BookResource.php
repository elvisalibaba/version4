<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class BookResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $coverUrl = $this->cover_url;
        if (is_string($coverUrl) && $coverUrl !== '' && ! str_starts_with($coverUrl, 'http://') && ! str_starts_with($coverUrl, 'https://')) {
            $coverUrl = Storage::disk('public')->url($coverUrl);
        }

        return [
            'id' => $this->id,
            'title' => $this->title,
            'subtitle' => $this->subtitle,
            'description' => $this->description,
            'price' => $this->price,
            'currency_code' => $this->currency_code,
            'author_id' => $this->author_id,
            'author_display_name' => $this->author_display_name ?? $this->whenLoaded('author', fn () => $this->author?->display_name),
            'cover_url' => $coverUrl,
            'cover_alt_text' => $this->cover_alt_text,
            'status' => $this->status,
            'review_status' => $this->review_status,
            'copyright_status' => $this->copyright_status,
            'language' => $this->language,
            'publisher' => $this->publisher,
            'publication_date' => $this->publication_date,
            'page_count' => $this->page_count,
            'categories' => $this->categories,
            'tags' => $this->tags,
            'isbn' => $this->isbn,
            'views_count' => $this->views_count,
            'purchases_count' => $this->purchases_count,
            'rating_avg' => $this->rating_avg,
            'ratings_count' => $this->ratings_count,
            'is_single_sale_enabled' => $this->is_single_sale_enabled,
            'is_subscription_available' => $this->is_subscription_available,
            'formats' => $this->whenLoaded('formats', fn () => $this->formats->map(fn ($format): array => [
                'id' => $format->id,
                'format' => $format->format,
                'price' => $format->price,
                'currency_code' => $format->currency_code,
                'stock_quantity' => $format->stock_quantity,
                'downloadable' => $format->downloadable,
                'is_published' => $format->is_published,
            ])),
            'subscription_plans' => $this->whenLoaded('subscriptionPlans'),
            'published_at' => $this->published_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
