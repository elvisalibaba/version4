<?php

namespace App\Filament\Author\Resources\Books\Pages;

use App\Filament\Author\Resources\Books\BookResource;
use App\Services\BookDocumentMetadataService;
use App\Services\PublicationReadinessService;
use Filament\Actions\Action;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\EditRecord;
use Illuminate\Support\Facades\Storage;

class EditBook extends EditRecord
{
    protected static string $resource = BookResource::class;

    /** Manuscrit déposé sur un livre publié, en attente de validation. */
    private ?string $pendingRevisionPath = null;

    protected function mutateFormDataBeforeSave(array $data): array
    {
        if ($this->record->status !== 'published') {
            return $data;
        }

        // Livre en ligne : le fichier lu et la couverture ne changent
        // qu'après validation de l'équipe éditoriale.
        if (filled($data['file_url'] ?? null) && $data['file_url'] !== $this->record->file_url) {
            $this->pendingRevisionPath = (string) $data['file_url'];
        }

        $data['file_url'] = $this->record->file_url;
        $data['cover_url'] = $this->record->cover_url;

        return $data;
    }

    protected function afterSave(): void
    {
        if ($this->pendingRevisionPath !== null) {
            $this->archivePendingRevision($this->pendingRevisionPath);
            $this->pendingRevisionPath = null;

            return;
        }

        $fileChanged = $this->record->wasChanged('file_url');
        $this->record = app(BookDocumentMetadataService::class)->enrich($this->record);

        if ($fileChanged && filled($this->record->file_url)) {
            $path = (string) $this->record->file_url;
            $nextVersion = ((int) $this->record->manuscriptVersions()->max('version_number')) + 1;

            $this->record->manuscriptVersions()->create([
                'created_by' => auth()->user()?->profile?->id,
                'version_number' => $nextVersion,
                'file_path' => $path,
                'file_format' => $this->record->file_format ?: pathinfo($path, PATHINFO_EXTENSION),
                'file_size' => Storage::disk('books')->exists($path) ? Storage::disk('books')->size($path) : null,
                'status' => 'author_draft',
                'change_summary' => 'Nouvelle version déposée depuis le Studio Auteur.',
            ]);

            $this->record->editorialEvents()->create([
                'actor_id' => auth()->user()?->profile?->id,
                'event_type' => 'manuscript_version_uploaded',
                'to_stage' => $this->record->editorial_stage,
                'notes' => 'Version '.$nextVersion.' du manuscrit déposée par l’auteur.',
                'payload' => ['version_number' => $nextVersion],
            ]);
        }
    }

    private function archivePendingRevision(string $path): void
    {
        $actorId = auth()->user()?->profile?->id;
        $nextVersion = ((int) $this->record->manuscriptVersions()->max('version_number')) + 1;

        $this->record->manuscriptVersions()->create([
            'created_by' => $actorId,
            'version_number' => $nextVersion,
            'file_path' => $path,
            'file_format' => pathinfo($path, PATHINFO_EXTENSION),
            'file_size' => Storage::disk('books')->exists($path) ? Storage::disk('books')->size($path) : null,
            'status' => 'pending_review',
            'change_summary' => 'Révision proposée depuis le Studio Auteur sur un livre publié.',
        ]);

        $this->record->forceFill([
            'review_status' => 'submitted',
            'submitted_at' => now(),
        ])->saveQuietly();

        $this->record->editorialEvents()->create([
            'actor_id' => $actorId,
            'event_type' => 'manuscript_version_uploaded',
            'to_stage' => $this->record->editorial_stage,
            'notes' => 'Version '.$nextVersion.' proposée sur un livre publié : en attente de validation.',
            'payload' => ['version_number' => $nextVersion, 'pending_review' => true],
        ]);

        Notification::make()
            ->title('Révision envoyée à l’équipe éditoriale')
            ->body('La version en ligne reste inchangée jusqu’à validation.')
            ->success()
            ->send();
    }

    protected function getHeaderActions(): array
    {
        return [
            Action::make('submitForReview')
                ->label('Soumettre pour validation')
                ->icon('heroicon-o-paper-airplane')
                ->color('primary')
                ->requiresConfirmation()
                ->visible(fn (): bool => in_array($this->record->review_status, ['draft', 'rejected', 'changes_requested'], true))
                ->action(function (): void {
                    $readiness = app(PublicationReadinessService::class)->evaluate($this->record);

                    $essentialMissing = array_intersect($readiness['blockers'], ['Métadonnées', 'Couverture', 'Manuscrit', 'Prix']);

                    if (! empty($essentialMissing)) {
                        Notification::make()
                            ->title('Livre incomplet')
                            ->body('Complétez d’abord : '.implode(', ', $essentialMissing).'.')
                            ->danger()
                            ->send();

                        return;
                    }

                    $fromStage = $this->record->editorial_stage;

                    $this->record->update([
                        'review_status' => 'submitted',
                        'submitted_at' => now(),
                        'review_note' => null,
                        'editorial_stage' => $fromStage === 'intake' ? 'brief' : $fromStage,
                    ]);

                    $this->record->editorialEvents()->create([
                        'actor_id' => auth()->user()?->profile?->id,
                        'event_type' => 'submitted_for_review',
                        'from_stage' => $fromStage,
                        'to_stage' => $this->record->editorial_stage,
                        'notes' => 'Manuscrit soumis à l’équipe éditoriale depuis le Studio Auteur.',
                    ]);

                    Notification::make()
                        ->title('Livre envoyé à l’équipe éditoriale')
                        ->body('Vous recevrez le résultat de la validation dans votre studio.')
                        ->success()
                        ->send();

                    $this->refreshFormData(['review_status', 'submitted_at', 'review_note']);
                }),
        ];
    }
}
