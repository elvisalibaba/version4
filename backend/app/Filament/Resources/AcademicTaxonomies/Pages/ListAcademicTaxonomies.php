<?php

namespace App\Filament\Resources\AcademicTaxonomies\Pages;

use App\Filament\Resources\AcademicTaxonomies\AcademicTaxonomyResource;
use Filament\Actions\Action;
use Filament\Actions\CreateAction;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\ListRecords;
use Illuminate\Support\Facades\Artisan;

class ListAcademicTaxonomies extends ListRecords
{
    protected static string $resource = AcademicTaxonomyResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Action::make('seedRdc')
                ->label('Charger le référentiel RDC')
                ->icon('heroicon-o-arrow-down-tray')
                ->requiresConfirmation()
                ->action(function (): void {
                    Artisan::call('db:seed', [
                        '--class' => 'Database\\Seeders\\RdcEducationCatalogSeeder',
                        '--force' => true,
                    ]);

                    Notification::make()
                        ->title('Référentiel scolaire RDC chargé')
                        ->success()
                        ->send();
                }),
            Action::make('syncRegEsu')
                ->label('Synchroniser RegESU')
                ->icon('heroicon-o-arrow-path')
                ->requiresConfirmation()
                ->modalDescription('Importe ou actualise les domaines, filières et mentions depuis le répertoire officiel RegESU.')
                ->action(function (): void {
                    Artisan::call('education:sync-regesu');

                    Notification::make()
                        ->title('Référentiel universitaire RegESU synchronisé')
                        ->body(trim(Artisan::output()))
                        ->success()
                        ->send();
                }),
            CreateAction::make()->label('Ajouter une classification'),
        ];
    }
}
