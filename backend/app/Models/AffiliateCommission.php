<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AffiliateCommission extends Model
{
    /** @use HasFactory<\Database\Factories\AffiliateCommissionFactory> */
    use HasFactory, HasUuids;

    protected $table = 'affiliate_wallet_transactions';

    protected $fillable = ['affiliate_user_id', 'referred_user_id', 'subscription_id', 'plan_id', 'source_type', 'source_book_id', 'source_plan_id', 'commission_rate', 'subscription_amount', 'commission_amount', 'currency_code', 'status'];

    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return ['commission_rate' => 'decimal:4', 'subscription_amount' => 'decimal:2', 'commission_amount' => 'decimal:2'];
    }

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(AffiliateWallet::class, 'affiliate_user_id', 'user_id');
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }
}
