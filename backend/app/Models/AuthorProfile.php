<?php

namespace App\Models;

use Database\Factories\AuthorProfileFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AuthorProfile extends Model
{
    /** @use HasFactory<AuthorProfileFactory> */
    use HasFactory, HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $attributes = [
        'social_links' => '[]',
        'genres' => '[]',
        'press_mentions' => '[]',
    ];

    protected $fillable = [
        'id', 'display_name', 'avatar_url', 'bio', 'website', 'location', 'social_links',
        'professional_headline', 'phone', 'genres', 'publishing_goals', 'favorite_book',
        'country_code', 'catalog_origin', 'rights_status', 'is_reference_profile', 'reference_source_url', 'rights_notes',
        'favorite_author', 'favorite_character', 'press_mentions',
    ];

    protected function casts(): array
    {
        return [
            'social_links' => 'array',
            'genres' => 'array',
            'press_mentions' => 'array',
            'is_reference_profile' => 'boolean',
        ];
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'id');
    }

    public function books(): HasMany
    {
        return $this->hasMany(Book::class, 'author_id');
    }

    public function contributedBooks(): BelongsToMany
    {
        return $this->belongsToMany(Book::class, 'book_authors', 'author_id', 'book_id')
            ->withPivot(['author_role', 'display_order']);
    }

    public function royaltyAccounts(): HasMany
    {
        return $this->hasMany(AuthorRoyaltyAccount::class, 'user_id', 'id');
    }

    public function hasPlatformAccount(): bool
    {
        return $this->profile()->exists();
    }
}
