<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentAttempt extends Model
{
    /** @use HasFactory<\Database\Factories\PaymentAttemptFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id', 'order_id', 'provider', 'payment_channel', 'provider_reference',
        'idempotency_key', 'amount', 'currency_code', 'status', 'request_payload',
        'response_payload', 'verified_at', 'failed_at', 'failure_reason',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'request_payload' => 'array',
            'response_payload' => 'array',
            'verified_at' => 'datetime',
            'failed_at' => 'datetime',
        ];
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'user_id');
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
