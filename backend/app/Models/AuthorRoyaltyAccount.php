<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Portefeuille de royalties d'un auteur dans UNE devise.
 * Un auteur possède autant de portefeuilles que de devises dans lesquelles il vend.
 */
class AuthorRoyaltyAccount extends Model
{
    use HasFactory, HasUuids;

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

    /**
     * Portefeuille principal à afficher : celui de la devise par défaut s'il
     * existe, sinon celui qui a le plus de gains cumulés.
     */
    public static function primaryFor(string $userId): ?self
    {
        $default = mb_strtoupper((string) config('publishing.default_currency', 'USD'));

        return static::query()
            ->where('user_id', $userId)
            ->orderByRaw('CASE WHEN currency_code = ? THEN 0 ELSE 1 END', [$default])
            ->orderByDesc('lifetime_earnings')
            ->first();
    }

    protected function scopeForCurrency(Builder $query, string $userId, string $currencyCode): Builder
    {
        return $query->where('user_id', $userId)
            ->where('currency_code', mb_strtoupper($currencyCode));
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'user_id');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(AuthorRoyaltyTransaction::class, 'user_id', 'user_id')
            ->where('currency_code', $this->currency_code);
    }

    public function payouts(): HasMany
    {
        return $this->hasMany(AuthorPayout::class, 'user_id', 'user_id')
            ->where('currency_code', $this->currency_code);
    }
}
