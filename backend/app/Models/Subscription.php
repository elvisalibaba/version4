<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subscription extends Model
{
    /** @use HasFactory<\Database\Factories\SubscriptionFactory> */
    use HasFactory, HasUuids;

    protected $table = 'user_subscriptions';

    protected $fillable = ['user_id', 'plan_id', 'status', 'started_at', 'expires_at', 'affiliate_user_id', 'affiliate_code_used', 'affiliate_source_type', 'affiliate_source_book_id', 'affiliate_source_plan_id', 'affiliate_commission_rate', 'affiliate_commission_amount'];

    protected function casts(): array
    {
        return ['started_at' => 'datetime', 'expires_at' => 'datetime', 'affiliate_commission_rate' => 'decimal:4', 'affiliate_commission_amount' => 'decimal:2'];
    }

    #[Scope]
    protected function currentlyActive(Builder $query): Builder
    {
        return $query->where('status', 'active')
            ->where(fn (Builder $query): Builder => $query->whereNull('expires_at')->orWhere('expires_at', '>', now()));
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'user_id');
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id');
    }
}
