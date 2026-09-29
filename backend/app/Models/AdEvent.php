<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdEvent extends Model
{
    use HasUuids;

    protected $fillable = ['assignment_id', 'event_type', 'user_id', 'session_hash', 'context', 'occurred_at'];

    protected function casts(): array { return ['context' => 'array', 'occurred_at' => 'datetime']; }
    public function assignment(): BelongsTo { return $this->belongsTo(AdAssignment::class, 'assignment_id'); }
}
