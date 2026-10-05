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
        'authorship_type' => 'named',
        'editorial_pole' => 'general',
        'work_type' => 'book',
        'editorial_stage' => 'intake',
        'bat_status' => 'pending',
        'reading_access_mode' => 'standard',
        'can_read_on_platform' => true,
        'allow_download' => false,
        'allow_print' => true,
        'allow_copy' => true,
        'reader_watermark_enabled' => false,
        'writing_status' => 'idea',
    ];

    protected $fillable = [
        'title', 'subtitle', 'description', 'price',
        'author_id', 'authorship_type', 'author_credit', 'author_display_name',
        'cover_url', 'cover_source', 'file_url',
        'status', 'co_authors', 'isbn', 'language', 'publisher', 'publication_date', 'page_count',
        'categories', 'tags', 'editorial_pole', 'work_type', 'editorial_stage',
        'spiritual_metadata', 'ingestion_metadata',
        'age_rating', 'edition', 'series_name', 'series_position',
        'file_format', 'file_size', 'sample_url',
        'publishing_house_id', 'imprint_id',
        'sample_pages', 'cover_thumbnail_url', 'cover_alt_text', 'published_at', 'currency_code',
        'is_single_sale_enabled', 'is_subscription_available',
        'review_status', 'submitted_at', 'reviewed_at', 'reviewed_by', 'review_note',
        'bat_status', 'bat_approved_at', 'bat_approved_by',
        'copyright_status', 'copyright_note',
        'reading_access_mode', 'can_read_on_platform', 'allow_download', 'allow_print', 'allow_copy',
        'reader_watermark_enabled', 'rights_agreement_reference', 'reader_rights_note',
        'writing_status', 'target_word_count', 'current_word_count', 'next_author_action',
        'editorial_deadline', 'author_private_notes',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'co_authors' => 'array',
            'categories' => 'array',
            'tags' => 'array',
            'spiritual_metadata' => 'array',
            'ingestion_metadata' => 'array',
            'publication_date' => 'date',
            'published_at' => 'datetime',
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'bat_approved_at' => 'datetime',
            'is_single_sale_enabled' => 'boolean',
            'is_subscription_available' => 'boolean',
            'rating_avg' => 'decimal:2',
            'can_read_on_platform' => 'boolean',
            'allow_download' => 'boolean',
            'allow_print' => 'boolean',
            'allow_copy' => 'boolean',
            'reader_watermark_enabled' => 'boolean',
            'editorial_deadline' => 'date',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Book $book): void {
            // Anonymous, collective, institutional and sacred texts can be
            // catalogued without a linked AuthorProfile.
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

    public function displayAuthorName(): ?string
    {
        $credit = trim((string) ($this->author_credit ?: $this->author_display_name));

        if ($credit !== '') {
            return $credit;
        }

        if ($this->relationLoaded('author') && $this->author) {
            return $this->author->display_name;
        }

        if (filled($this->author_id)) {
            return $this->author()->value('display_name');
        }

        return match ($this->authorship_type) {
            'anonymous' => 'Anonyme',
            'collective' => 'Collectif',
            'institutional' => 'Institution',
            'traditional' => 'Tradition',
            'sacred_text' => 'Texte sacré',
            default => null,
        };
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

    public function ratings(): HasMany
    {
        return $this->hasMany(Rating::class);
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

    public function educationTaxonomies(): BelongsToMany
    {
        return $this->belongsToMany(
            AcademicTaxonomy::class,
            'book_academic_taxonomy',
            'book_id',
            'academic_taxonomy_id',
        )->withTimestamps();
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

    public function editorialEvents(): HasMany
    {
        return $this->hasMany(BookEditorialEvent::class)->orderByDesc('created_at');
    }

    public function manuscriptVersions(): HasMany
    {
        return $this->hasMany(BookManuscriptVersion::class)->orderByDesc('version_number');
    }

    public function readerPermissions(): array
    {
        return [
            'mode' => $this->reading_access_mode,
            'can_read_on_platform' => (bool) $this->can_read_on_platform,
            'can_download' => (bool) $this->allow_download,
            'can_print' => (bool) $this->allow_print,
            'can_copy' => (bool) $this->allow_copy,
            'watermark' => (bool) $this->reader_watermark_enabled,
        ];
    }
}
