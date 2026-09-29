<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AdCreative extends Model
{
    use HasUuids;

    protected $fillable = [
        'campaign_id', 'title', 'creative_type', 'headline', 'body', 'asset_url',
        'click_url', 'cta_label', 'alt_text', 'metadata', 'is_active',
    ];

    protected function casts(): array { return ['metadata' => 'array', 'is_active' => 'boolean']; }

    public function campaign(): BelongsTo { return $this->belongsTo(AdCampaign::class, 'campaign_id'); }
    public function assignments(): HasMany { return $this->hasMany(AdAssignment::class, 'creative_id'); }
}
