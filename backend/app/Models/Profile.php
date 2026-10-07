<?php

namespace App\Models;

use Database\Factories\ProfileFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Profile extends Model
{
    /** @use HasFactory<ProfileFactory> */
    use HasFactory, HasUuids;

    public const UPDATED_AT = null;

    protected $fillable = [
        'id', 'email', 'name', 'avatar_url', 'role', 'staff_role', 'staff_permissions', 'first_name', 'last_name', 'phone', 'country', 'city',
        'preferred_language', 'favorite_categories', 'marketing_opt_in', 'referred_by_affiliate_user_id',
        'referred_by_affiliate_code', 'affiliate_source_type', 'affiliate_source_book_id', 'affiliate_source_plan_id',
    ];

    protected function casts(): array
    {
        return [
            'favorite_categories' => 'array',
            'staff_permissions' => 'array',
            'marketing_opt_in' => 'boolean',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id');
    }

    public function hasStaffPermission(string $permission): bool
    {
        if ($this->role !== 'admin') {
            return false;
        }

        $role = $this->staff_role ?: 'super_admin';
        $rolePermissions = (array) config("staff_permissions.roles.{$role}", []);
        $customPermissions = (array) ($this->staff_permissions ?? []);
        $permissions = array_values(array_unique([...$rolePermissions, ...$customPermissions]));

        return in_array('*', $permissions, true)
            || in_array($permission, $permissions, true);
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'admin' && ($this->staff_role === null || $this->staff_role === 'super_admin');
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

    public function devices(): HasMany
    {
        return $this->hasMany(UserDevice::class, 'user_id');
    }

    public function readingProgress(): HasMany
    {
        return $this->hasMany(ReadingProgress::class, 'user_id');
    }

    public function highlights(): HasMany
    {
        return $this->hasMany(Highlight::class, 'user_id');
    }

    public function affiliateWallet(): HasOne
    {
        return $this->hasOne(AffiliateWallet::class, 'user_id');
    }

    public function royaltyAccounts(): HasMany
    {
        return $this->hasMany(AuthorRoyaltyAccount::class, 'user_id');
    }

    public function royaltyTransactions(): HasMany
    {
        return $this->hasMany(AuthorRoyaltyTransaction::class, 'user_id');
    }

    public function authorPayoutAccounts(): HasMany
    {
        return $this->hasMany(AuthorPayoutAccount::class, 'user_id');
    }

    public function authorPayouts(): HasMany
    {
        return $this->hasMany(AuthorPayout::class, 'user_id');
    }
}
