<?php

namespace App\Filament\Resources\Books\Pages;

use App\Filament\Resources\Books\BookResource;
use App\Models\AuthorProfile;
use App\Services\BookDocumentMetadataService;
use App\Services\BookTaxonomyService;
use Filament\Resources\Pages\EditRecord;

class EditBook extends EditRecord
{
    protected static string $resource = BookResource::class;

    private ?string $previousEditorialStage = null;

    private ?string $previousBatStatus = null;

    protected function mutateFormDataBeforeSave(array $data): array
    {
        $this->previousEditorialStage = $this->record->editorial_stage;
        $this->previousBatStatus = $this->record->bat_status;

        $data['co_authors'] = is_array($data['co_authors'] ?? null) ? $data['co_authors'] : [];
        $data['categories'] = is_array($data['categories'] ?? null) ? $data['categories'] : [];
        $data['tags'] = is_array($data['tags'] ?? null) ? $data['tags'] : [];
        $data['spiritual_metadata'] = is_array($data['spiritual_metadata'] ?? null)
            ? array_filter($data['spiritual_metadata'], fn (mixed $value): bool => filled($value))
            : null;

        $catalogAuthorName = filled($data['author_id'] ?? null)
            ? AuthorProfile::query()->whereKey($data['author_id'])->value('display_name')
            : null;

        if (blank($data['author_credit'] ?? null) && filled($catalogAuthorName)) {
            $data['author_credit'] = $catalogAuthorName;
        }

        $data['author_display_name'] = filled($data['author_credit'] ?? null)
            ? $data['author_credit']
            : $catalogAuthorName;

        if (blank($data['author_id'] ?? null) && ($data['authorship_type'] ?? 'named') === 'named') {
            $data['authorship_type'] = filled($data['author_credit'] ?? null) ? 'named' : 'anonymous';
        }

        if (
            filled($data['cover_url'] ?? null)
            && ($data['cover_url'] ?? null) !== $this->record->cover_url
        ) {
            $data['cover_source'] = 'upload';
        }

        if (($data['status'] ?? $this->record->status) === 'published') {
            $data['published_at'] = $this->record->published_at ?? now();

            if (($data['editorial_stage'] ?? $this->record->editorial_stage) !== 'published') {
                $data['editorial_stage'] = 'published';
            }
        }

        if (
            ($data['bat_status'] ?? $this->record->bat_status) === 'approved'
            && $this->record->bat_status !== 'approved'
        ) {
            $data['bat_approved_at'] = now();
            $data['bat_approved_by'] = auth()->user()?->profile?->id;
        }

        return $data;
    }

    protected function afterSave(): void
    {
        app(BookTaxonomyService::class)->sync($this->record, $this->record->categories ?? []);
        $this->record = app(BookDocumentMetadataService::class)->enrich($this->record);

        if ($this->previousEditorialStage !== $this->record->editorial_stage) {
            $this->record->editorialEvents()->create([
                'actor_id' => auth()->user()?->profile?->id,
                'event_type' => 'stage_changed',
                'from_stage' => $this->previousEditorialStage,
                'to_stage' => $this->record->editorial_stage,
                'notes' => 'Étape éditoriale mise à jour depuis l’administration.',
            ]);
        }

        if ($this->previousBatStatus !== $this->record->bat_status) {
            $this->record->editorialEvents()->create([
                'actor_id' => auth()->user()?->profile?->id,
                'event_type' => 'bat_status_changed',
                'from_stage' => $this->previousBatStatus,
                'to_stage' => $this->record->bat_status,
                'notes' => 'Statut du Bon à tirer mis à jour.',
            ]);
        }
    }
}
