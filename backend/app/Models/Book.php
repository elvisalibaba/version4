<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Validation\ValidationException;

class Book extends Model
{
    /** @use HasFactory<\Database\Factories\BookFactory> */
    use HasFactory, HasUuids;

    protected $attributes = [
        'co_authors' => '[]',
        'categories' => '[]',
        'tags' => '[]',
    ];

    protected $fillable = [
        'title', 'subtitle', 'description', 'price', 'author_id', 'author_display_name', 'cover_url', 'file_url',
        'status', 'co_authors', 'isbn', 'language', 'publisher', 'publication_date', 'page_count', 'categories',
        'tags', 'age_rating', 'edition', 'series_name', 'series_position', 'file_format', 'file_size', 'sample_url',
        'publishing_house_id', 'imprint_id',
        'sample_pages', 'cover_thumbnail_url', 'cover_alt_text', 'published_at', 'currency_code',
        'is_single_sale_enabled', 'is_subscription_available', 'review_status', 'submitted_at', 'reviewed_at',
        'reviewed_by', 'review_note', 'copyright_status', 'copyright_note',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2', 'co_authors' => 'array', 'categories' => 'array', 'tags' => 'array',
            'publication_date' => 'date', 'published_at' => 'datetime', 'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime', 'is_single_sale_enabled' => 'boolean',
            'is_subscription_available' => 'boolean', 'rating_avg' => 'decimal:2',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Book $book): void {
            if ($book->status !== 'published' || blank($book->author_id)) {
                return;
            }

            $author = AuthorProfile::query()->find($book->author_id);

            if (! $author?->is_reference_profile || $author->rights_status === 'acquired') {
                return;
            }

            $hasActiveRights = filled($book->id) && RightsContract::query()
                ->where('book_id', $book->id)
                ->where('status', 'active')
                ->where(fn ($query) => $query->whereNull('starts_at')->orWhere('starts_at', '<=', now()->toDateString()))
                ->where(fn ($query) => $query->whereNull('ends_at')->orWhere('ends_at', '>=', now()->toDateString()))
                ->exists();

            if (! $hasActiveRights) {
                throw ValidationException::withMessages([
                    'status' => 'Publication bloquée : cet auteur est une référence internationale et aucun droit actif n’est enregistré pour ce titre.',
                ]);
            }
        });
    }

    #[Scope]
    protected function publiclyAvailable(Builder $query): Builder
    {
        return $query->whereIn('status', ['published', 'coming_soon'])
            ->where('copyright_status', 'clear');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(AuthorProfile::class, 'author_id');
    }

    public function contributors(): BelongsToMany
    {
        return $this->belongsToMany(AuthorProfile::class, 'book_authors', 'book_id', 'author_id')
            ->withPivot(['author_role', 'display_order']);
    }

    public function formats(): HasMany
    {
        return $this->hasMany(BookFormat::class);
    }

    public function assets(): HasMany
    {
        return $this->hasMany(BookAsset::class);
    }

    public function subscriptionPlans(): BelongsToMany
    {
        return $this->belongsToMany(SubscriptionPlan::class, 'subscription_plan_books', 'book_id', 'plan_id');
    }

    public function libraryEntries(): HasMany
    {
        return $this->hasMany(Library::class);
    }

    public function categoriesRelation(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'book_categories', 'book_id', 'category_id');
    }

    public function publishingHouse(): BelongsTo
    {
        return $this->belongsTo(PublishingHouse::class);
    }

    public function imprint(): BelongsTo
    {
        return $this->belongsTo(PublishingImprint::class, 'imprint_id');
    }

    public function rightsContracts(): HasMany
    {
        return $this->hasMany(RightsContract::class);
    }

    public function mediaEditions(): HasMany
    {
        return $this->hasMany(MediaEdition::class);
    }

    public function distributionSetting(): HasOne
    {
        return $this->hasOne(BookDistributionSetting::class);
    }

    public function royaltyTransactions(): HasMany
    {
        return $this->hasMany(AuthorRoyaltyTransaction::class);
    }
}
