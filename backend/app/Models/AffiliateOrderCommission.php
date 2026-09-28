<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AffiliateOrderCommission extends Model
{
    /** @use HasFactory<\Database\Factories\AffiliateOrderCommissionFactory> */
    use HasFactory, HasUuids;

    protected $table = 'affiliate_order_transactions';

    public const UPDATED_AT = null;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['commission_rate' => 'decimal:4', 'order_amount' => 'decimal:2', 'commission_amount' => 'decimal:2'];
    }
}
