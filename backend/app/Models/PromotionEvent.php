<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PromotionEvent extends Model
{
    use HasUuids;

    protected $fillable = [
        'promotion_campaign_id', 'book_id', 'user_id', 'order_id', 'event_type',
        'channel', 'revenue_amount', 'currency_code', 'metadata', 'occurred_at',
    ];

    protected function casts(): array
    {
        return [
            'revenue_amount' => 'decimal:2',
            'metadata' => 'array',
            'occurred_at' => 'datetime',
        ];
    }

    public function campaign(): BelongsTo { return $this->belongsTo(PromotionCampaign::class, 'promotion_campaign_id'); }
}
