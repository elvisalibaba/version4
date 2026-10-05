<?php

namespace App\Services;

use App\Models\PlatformAuditEvent;
use Illuminate\Database\Eloquent\Model;

class PlatformAuditService
{
    public function record(
        string $action,
        ?Model $entity = null,
        ?string $actorId = null,
        array $before = [],
        array $after = [],
        ?string $summary = null,
        string $severity = 'info',
        array $context = [],
    ): PlatformAuditEvent {
        return PlatformAuditEvent::query()->create([
            'actor_id' => $actorId,
            'action' => $action,
            'entity_type' => $entity ? $entity::class : null,
            'entity_id' => $entity?->getKey(),
            'severity' => in_array($severity, ['info', 'warning', 'critical'], true) ? $severity : 'info',
            'summary' => $summary,
            'before_state' => $before ?: null,
            'after_state' => $after ?: null,
            'context' => $context ?: null,
            'occurred_at' => now(),
        ]);
    }
}
