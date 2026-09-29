<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AuthorPayoutAccount extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id', 'method', 'provider', 'country_code', 'currency_code',
        'account_name', 'account_identifier', 'is_default', 'is_verified', 'verified_at',
    ];

    protected $hidden = ['account_identifier'];

    protected function casts(): array
    {
        return [
            'account_identifier' => 'encrypted',
            'is_default' => 'boolean',
            'is_verified' => 'boolean',
            'verified_at' => 'datetime',
        ];
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'user_id');
    }

    public function payouts(): HasMany
    {
        return $this->hasMany(AuthorPayout::class, 'payout_account_id');
    }
}
