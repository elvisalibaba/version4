<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AdAssignment extends Model
{
    use HasUuids;

    protected $fillable = [
        'campaign_id', 'creative_id', 'placement_id', 'status', 'weight', 'starts_at', 'ends_at',
    ];

    protected function casts(): array
    {
        return ['starts_at' => 'datetime', 'ends_at' => 'datetime'];
    }

    public function campaign(): BelongsTo { return $this->belongsTo(AdCampaign::class, 'campaign_id'); }
    public function creative(): BelongsTo { return $this->belongsTo(AdCreative::class, 'creative_id'); }
    public function placement(): BelongsTo { return $this->belongsTo(AdPlacement::class, 'placement_id'); }
    public function events(): HasMany { return $this->hasMany(AdEvent::class, 'assignment_id'); }
}
