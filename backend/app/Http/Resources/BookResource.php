<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class BookResource extends JsonResource
{
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
            'cover_thumbnail_url' => $this->cover_thumbnail_url,
            'status' => $this->status,
            'review_status' => $this->review_status,
            'review_note' => $this->review_note,
            'copyright_status' => $this->copyright_status,
            'copyright_note' => $this->copyright_note,
            'language' => $this->language,
            'publisher' => $this->publisher,
            'publishing_house' => $this->whenLoaded('publishingHouse', fn () => $this->publishingHouse ? [
                'id' => $this->publishingHouse->id,
                'name' => $this->publishingHouse->name,
                'slug' => $this->publishingHouse->slug,
            ] : null),
            'imprint' => $this->whenLoaded('imprint', fn () => $this->imprint ? [
                'id' => $this->imprint->id,
                'name' => $this->imprint->name,
                'slug' => $this->imprint->slug,
            ] : null),
            'publication_date' => $this->publication_date,
            'page_count' => $this->page_count,
            'co_authors' => $this->co_authors,
            'categories' => $this->categories,
            'tags' => $this->tags,
            'age_rating' => $this->age_rating,
            'edition' => $this->edition,
            'series_name' => $this->series_name,
            'series_position' => $this->series_position,
            'isbn' => $this->isbn,
            'file_format' => $this->file_format,
            'file_size' => $this->file_size,
            'has_file' => filled($this->file_url),
            'has_sample' => filled($this->sample_url),
            'sample_pages' => $this->sample_pages,
            'views_count' => $this->views_count,
            'clicks_count' => $this->clicks_count,
            'purchases_count' => $this->purchases_count,
            'is_free' => $this->is_single_sale_enabled && (float) $this->price <= 0,
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
                'file_size_mb' => $format->file_size_mb,
                'downloadable' => $format->downloadable,
                'is_published' => $format->is_published,
                'printing_cost' => $format->printing_cost,
            ])),
            'media_editions' => $this->whenLoaded('mediaEditions', fn () => $this->mediaEditions->map(fn ($edition): array => [
                'id' => $edition->id,
                'media_type' => $edition->media_type,
                'title' => $edition->title,
                'language' => $edition->language,
                'duration_seconds' => $edition->duration_seconds,
                'narrator' => $edition->narrator,
                'presenter' => $edition->presenter,
                'preview_url' => $edition->preview_url,
                'status' => $edition->status,
            ])),
            'subscription_plans' => $this->whenLoaded('subscriptionPlans'),
            'published_at' => $this->published_at,
            'submitted_at' => $this->submitted_at,
            'reviewed_at' => $this->reviewed_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
