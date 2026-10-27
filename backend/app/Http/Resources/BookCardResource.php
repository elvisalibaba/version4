<?php

namespace App\Http\Resources;

use App\Services\BookAccessService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * Opt-in compact public catalogue payload for the web storefront.
 * The full BookResource and the mobile API response remain unchanged.
 */
class BookCardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $publicUrl = static function (?string $value): ?string {
            if (! is_string($value) || trim($value) === '') {
                return null;
            }
            $value = trim($value);

            return str_starts_with($value, 'https://') || str_starts_with($value, 'http://')
                ? $value
                : Storage::disk('public')->url(ltrim($value, '/'));
        };

        return [
            'id' => $this->id,
            'title' => $this->title,
            'subtitle' => $this->subtitle,
            'description' => null,
            'author_id' => $this->author_id,
            'author_display_name' => $this->resource->displayAuthorName(),
            'price' => $this->price,
            'currency_code' => $this->currency_code,
            'status' => $this->status,
            'cover_url' => $publicUrl($this->cover_url),
            'cover_thumbnail_url' => $publicUrl($this->cover_thumbnail_url),
            'cover_alt_text' => $this->cover_alt_text,
            'categories' => $this->categories,
            'tags' => [],
            'language' => $this->language,
            'publisher' => null,
            'publication_date' => null,
            'page_count' => $this->page_count,
            'isbn' => null,
            'file_format' => $this->file_format,
            'has_file' => filled($this->file_url),
            'has_sample' => filled($this->sample_url),
            'sample_pages' => $this->sample_pages,
            'work_type' => $this->work_type,
            'purchases_count' => (int) ($this->purchases_count ?? 0),
            'is_free' => app(BookAccessService::class)->isFreeTitle($this->resource),
            'rating_avg' => $this->getAttribute('visible_rating_avg') !== null
                ? (float) $this->getAttribute('visible_rating_avg') : null,
            'ratings_count' => (int) ($this->getAttribute('visible_ratings_count') ?? 0),
            'is_single_sale_enabled' => (bool) $this->is_single_sale_enabled,
            'is_subscription_available' => (bool) $this->is_subscription_available,
            'formats' => $this->whenLoaded('formats', fn () => $this->formats->map(fn ($format): array => [
                'id' => $format->id,
                'format' => $format->format,
                'price' => $format->price,
                'currency_code' => $format->currency_code,
                'downloadable' => (bool) $format->downloadable,
                'is_published' => (bool) $format->is_published,
            ])->values()),
            'media_editions' => $this->whenLoaded('mediaEditions', fn () => $this->mediaEditions->map(fn ($edition): array => [
                'media_type' => $edition->media_type,
            ])->values()),
            'published_at' => $this->published_at,
        ];
    }
}
