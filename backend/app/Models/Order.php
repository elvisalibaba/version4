<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    /** @use HasFactory<\Database\Factories\OrderFactory> */
    use HasFactory, HasUuids;

    protected $fillable = ['user_id', 'total_price', 'payment_status', 'currency_code', 'payment_provider', 'payment_transaction_id', 'payment_channel', 'payment_provider_status', 'payment_verified_at', 'payment_metadata'];

    protected function casts(): array
    {
        return ['total_price' => 'decimal:2', 'payment_verified_at' => 'datetime', 'payment_metadata' => 'array'];
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'user_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
