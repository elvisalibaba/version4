<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AffiliatePayoutAccount extends Model
{
    /** @use HasFactory<\Database\Factories\AffiliatePayoutAccountFactory> */
    use HasFactory, HasUuids;

    protected $fillable = ['user_id', 'provider', 'account_name', 'account_number', 'currency_code', 'is_verified'];

    protected $hidden = ['account_number'];

    protected function casts(): array
    {
        return ['account_number' => 'encrypted', 'is_verified' => 'boolean'];
    }
}
