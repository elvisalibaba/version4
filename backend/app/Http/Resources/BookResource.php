<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

class BookResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $resolvePublicMedia = static function (?string $value): ?string {
            if (! is_string($value) || trim($value) === '') {
                return null;
            }

            $value = trim($value);

            if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
                return $value;
            }

            return Storage::disk('public')->url(ltrim($value, '/'));
        };

        $coverUrl = $resolvePublicMedia($this->cover_url);
        $coverThumbnailUrl = $resolvePublicMedia($this->cover_thumbnail_url);

        $hasVisibleAggregates = array_key_exists('visible_ratings_count', $this->resource->getAttributes());

        return [
            'id' => $this->id,
            'title' => $this->title,
            'subtitle' => $this->subtitle,
            'description' => $this->description,
            'price' => $this->price,
            'currency_code' => $this->currency_code,
            'author_id' => $this->author_id,
            'authorship_type' => $this->authorship_type,
            'author_credit' => $this->author_credit,
            'author_display_name' => $this->resource->displayAuthorName(),
            'cover_url' => $coverUrl,
            'cover_alt_text' => $this->cover_alt_text,
            'cover_thumbnail_url' => $coverThumbnailUrl,
            'cover_source' => $this->cover_source,
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
            'education_taxonomies' => $this->whenLoaded('educationTaxonomies', fn () => $this->educationTaxonomies->map(fn ($taxonomy): array => [
                'id' => $taxonomy->id,
                'parent_id' => $taxonomy->parent_id,
                'audience' => $taxonomy->audience,
                'kind' => $taxonomy->kind,
                'code' => $taxonomy->code,
                'name' => $taxonomy->name,
                'slug' => $taxonomy->slug,
                'is_official' => $taxonomy->is_official,
            ])->values()),
            'tags' => $this->tags,
            'editorial_pole' => $this->editorial_pole,
            'work_type' => $this->work_type,
            'editorial_stage' => $this->editorial_stage,
            'spiritual_metadata' => $this->spiritual_metadata,
            'bat_status' => $this->bat_status,
            'bat_approved_at' => $this->bat_approved_at,
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
            'rating_avg' => $hasVisibleAggregates
                ? ($this->getAttribute('visible_rating_avg') !== null ? (float) $this->getAttribute('visible_rating_avg') : null)
                : ($this->rating_avg !== null ? (float) $this->rating_avg : null),
            'ratings_count' => $hasVisibleAggregates
                ? (int) $this->getAttribute('visible_ratings_count')
                : (int) ($this->ratings_count ?? 0),
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
                'preview_url' => blank($edition->preview_url)
                    ? null
                    : (
                        str_starts_with((string) $edition->preview_url, 'http://') || str_starts_with((string) $edition->preview_url, 'https://')
                            ? $edition->preview_url
                            : URL::temporarySignedRoute(
                                'api.v1.media-editions.preview',
                                now()->addMinutes(15),
                                ['mediaEdition' => $edition->id],
                            )
                    ),
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
