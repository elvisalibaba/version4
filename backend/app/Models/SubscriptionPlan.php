<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionPlan extends Model
{
    /** @use HasFactory<\Database\Factories\SubscriptionPlanFactory> */
    use HasFactory, HasUuids;

    protected $fillable = ['name', 'slug', 'description', 'monthly_price', 'currency_code', 'is_active', 'max_devices', 'offline_days', 'downloads_enabled'];

    protected function casts(): array
    {
        return ['monthly_price' => 'decimal:2', 'is_active' => 'boolean', 'downloads_enabled' => 'boolean'];
    }

    public function books(): BelongsToMany
    {
        return $this->belongsToMany(Book::class, 'subscription_plan_books', 'plan_id', 'book_id');
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class, 'plan_id');
    }
}
