<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlatformAuditEvent extends Model
{
    use HasUuids;

    protected $fillable = [
        'actor_id', 'action', 'entity_type', 'entity_id', 'severity', 'summary',
        'before_state', 'after_state', 'context', 'occurred_at',
    ];

    protected function casts(): array
    {
        return [
            'before_state' => 'array',
            'after_state' => 'array',
            'context' => 'array',
            'occurred_at' => 'datetime',
        ];
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'actor_id');
    }
}
