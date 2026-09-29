<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AuthorRoyaltyAccount extends Model
{
    use HasFactory;

    protected $primaryKey = 'user_id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'user_id', 'currency_code', 'pending_balance', 'available_balance',
        'lifetime_earnings', 'lifetime_paid', 'minimum_payout', 'status',
    ];

    protected function casts(): array
    {
        return [
            'pending_balance' => 'decimal:2',
            'available_balance' => 'decimal:2',
            'lifetime_earnings' => 'decimal:2',
            'lifetime_paid' => 'decimal:2',
            'minimum_payout' => 'decimal:2',
        ];
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'user_id');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(AuthorRoyaltyTransaction::class, 'user_id');
    }

    public function payouts(): HasMany
    {
        return $this->hasMany(AuthorPayout::class, 'user_id');
    }
}
