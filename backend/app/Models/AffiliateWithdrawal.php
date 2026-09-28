<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AffiliateWithdrawal extends Model
{
    /** @use HasFactory<\Database\Factories\AffiliateWithdrawalFactory> */
    use HasFactory, HasUuids;

    protected $fillable = ['user_id', 'payout_account_id', 'amount', 'currency_code', 'status', 'provider_reference', 'requested_at', 'approved_at', 'paid_at'];

    protected function casts(): array
    {
        return ['amount' => 'decimal:2', 'requested_at' => 'datetime', 'approved_at' => 'datetime', 'paid_at' => 'datetime'];
    }
}
