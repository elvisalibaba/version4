<?php

namespace App\Filament\Author\Resources\Books\Pages;

use App\Filament\Author\Resources\Books\BookResource;
use App\Services\BookDocumentMetadataService;
use App\Services\PublicationReadinessService;
use Filament\Actions\Action;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\EditRecord;

class EditBook extends EditRecord
{
    protected static string $resource = BookResource::class;

    protected function afterSave(): void
    {
        $this->record = app(BookDocumentMetadataService::class)->enrich($this->record);
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
