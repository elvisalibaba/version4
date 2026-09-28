<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Profile extends Model
{
    /** @use HasFactory<\Database\Factories\ProfileFactory> */
    use HasFactory, HasUuids;

    public const UPDATED_AT = null;

    protected $fillable = [
        'id', 'email', 'name', 'role', 'first_name', 'last_name', 'phone', 'country', 'city',
        'preferred_language', 'favorite_categories', 'marketing_opt_in', 'referred_by_affiliate_user_id',
        'referred_by_affiliate_code', 'affiliate_source_type', 'affiliate_source_book_id', 'affiliate_source_plan_id',
    ];

    protected function casts(): array
    {
        return [
            'favorite_categories' => 'array',
            'marketing_opt_in' => 'boolean',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id');
    }

    public function authorProfile(): HasOne
    {
        return $this->hasOne(AuthorProfile::class, 'id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'user_id');
    }

    public function libraryEntries(): HasMany
    {
        return $this->hasMany(Library::class, 'user_id');
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class, 'user_id');
    }

    public function affiliateWallet(): HasOne
    {
        return $this->hasOne(AffiliateWallet::class, 'user_id');
    }
}
