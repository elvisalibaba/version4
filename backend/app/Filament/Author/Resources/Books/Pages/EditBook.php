<?php

namespace App\Filament\Author\Resources\Books\Pages;

use App\Filament\Author\Resources\Books\BookResource;
use App\Services\PublicationReadinessService;
use Filament\Actions\Action;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\EditRecord;

class EditBook extends EditRecord
{
    protected static string $resource = BookResource::class;

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

                    $this->record->update([
                        'review_status' => 'submitted',
                        'submitted_at' => now(),
                        'review_note' => null,
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
