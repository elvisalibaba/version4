<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PromotionCampaign extends Model
{
    use HasUuids;

    protected $fillable = [
        'name', 'internal_code', 'headline', 'description', 'discount_type', 'discount_value',
        'currency_code', 'selected_book_ids', 'channels', 'is_active', 'priority',
        'starts_at', 'ends_at', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'discount_value' => 'decimal:2',
            'selected_book_ids' => 'array',
            'channels' => 'array',
            'is_active' => 'boolean',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'created_by');
    }

    public function events(): HasMany
    {
        return $this->hasMany(PromotionEvent::class, 'promotion_campaign_id');
    }

    public function isRunning(): bool
    {
        return $this->is_active
            && ($this->starts_at === null || $this->starts_at->lte(now()))
            && ($this->ends_at === null || $this->ends_at->gte(now()));
    }
}
