<?php

namespace App\Observers;

use App\Services\PlatformAuditService;
use Illuminate\Database\Eloquent\Model;

class CriticalModelAuditObserver
{
    public function created(Model $model): void
    {
        $this->record('created', $model, [], $model->getAttributes());
    }

    public function updated(Model $model): void
    {
        $changes = $model->getChanges();

        if ($changes === []) {
            return;
        }

        $before = [];
        foreach (array_keys($changes) as $key) {
            $before[$key] = $model->getOriginal($key);
        }

        $this->record('updated', $model, $before, $changes);
    }

    public function deleted(Model $model): void
    {
        $this->record('deleted', $model, $model->getAttributes(), []);
    }

    private function record(string $verb, Model $model, array $before, array $after): void
    {
        $entity = class_basename($model);
        $severity = in_array($entity, ['RightsContract', 'AuthorPayout', 'Order'], true)
            ? 'critical'
            : 'warning';

        app(PlatformAuditService::class)->record(
            action: mb_strtolower($entity).'.'.$verb,
            entity: $model,
            actorId: auth()->user()?->profile?->id,
            before: $before,
            after: $after,
            summary: $entity.' '.$verb.' via Holistique Books.',
            severity: $severity,
            context: [
                'source' => app()->runningInConsole() ? 'console' : 'web',
                'request_ip' => app()->runningInConsole() ? null : request()->ip(),
            ],
        );
    }
}
