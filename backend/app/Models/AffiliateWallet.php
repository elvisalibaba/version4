<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AffiliateWallet extends Model
{
    /** @use HasFactory<\Database\Factories\AffiliateWalletFactory> */
    use HasFactory;

    protected $table = 'reader_affiliate_profiles';

    protected $primaryKey = 'user_id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['user_id', 'affiliate_code', 'commission_rate', 'wallet_balance', 'lifetime_credited', 'currency_code', 'is_active'];

    protected function casts(): array
    {
        return ['commission_rate' => 'decimal:4', 'wallet_balance' => 'decimal:2', 'lifetime_credited' => 'decimal:2', 'is_active' => 'boolean'];
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'user_id');
    }

    public function commissions(): HasMany
    {
        return $this->hasMany(AffiliateCommission::class, 'affiliate_user_id', 'user_id');
    }
}
