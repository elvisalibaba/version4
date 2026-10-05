<?php

namespace App\Filament\Resources\Books\Pages;

use App\Filament\Resources\Books\BookResource;
use App\Models\AuthorProfile;
use App\Services\AdminBookImportService;
use App\Services\AdminBookPublicationService;
use Filament\Actions\Action;
use Filament\Actions\CreateAction;
use Filament\Forms\Components\Checkbox;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\ListRecords;
use Illuminate\Support\Str;
use Livewire\Features\SupportFileUploads\TemporaryUploadedFile;

class ListBooks extends ListRecords
{
    protected static string $resource = BookResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make()->label('Ajouter un livre'),
            Action::make('publishImportedBooks')
                ->label('Valider et publier les imports')
                ->icon('heroicon-o-check-badge')
                ->color('warning')
                ->requiresConfirmation()
                ->modalHeading('Valider et publier tous les livres importés')
                ->modalDescription('Cette action passe les livres importés en Publié, Approuvé et Droits validés. Confirmez uniquement si la plateforme dispose réellement des droits de diffusion nécessaires.')
                ->schema([
                    Checkbox::make('rights_confirmed')
                        ->label('Je confirme disposer des droits nécessaires pour publier ces livres.')
                        ->accepted()
                        ->required(),
                ])
                ->action(function (array $data, AdminBookPublicationService $publisher): void {
                    $administrator = auth()->user()?->profile;
                    abort_unless($administrator?->role === 'admin', 403);

                    $result = $publisher->publishAllImported(
                        administrator: $administrator,
                        rightsConfirmed: (bool) ($data['rights_confirmed'] ?? false),
                    );

                    $notification = Notification::make()
                        ->title("Publication terminée : {$result['published']} livre(s)")
                        ->body(
                            $result['failed'] > 0
                                ? "{$result['failed']} livre(s) n’ont pas pu être publiés. Vérifiez notamment les contrats de droits des auteurs de référence."
                                : 'Les livres importés ont été validés et publiés.'
                        );

                    $result['failed'] > 0
                        ? $notification->warning()->send()
                        : $notification->success()->send();
                }),
            Action::make('preparedBulkImport')
                ->label('Importer un lot préparé (jusqu’à 50)')
                ->icon('heroicon-o-archive-box-arrow-down')
                ->color('success')
                ->schema([
                    FileUpload::make('archive')
                        ->label('Lot HolisticBooks ZIP')
                        ->disk('books')
                        ->directory('admin-imports/prepared')
                        ->visibility('private')
                        ->acceptedFileTypes(['application/zip', 'application/x-zip-compressed', 'multipart/x-zip'])
                        ->maxSize(460800)
                        ->getUploadedFileNameForStorageUsing(fn (TemporaryUploadedFile $file): string => Str::uuid().'-lot-holisticbooks.zip')
                        ->helperText('ZIP préparé contenant manifest.json, books/ et covers/. Maximum 50 livres et 450 Mo.')
                        ->required(),
                ])
                ->action(function (array $data, AdminBookImportService $importer): void {
                    $administrator = auth()->user()?->profile;
                    abort_unless($administrator?->role === 'admin', 403);

                    $batch = $importer->importPreparedArchive(
                        archivePath: (string) $data['archive'],
                        administrator: $administrator,
                    );

                    $notification = Notification::make()
                        ->title("Lot importé : {$batch->completed_items} livre(s) créé(s)")
                        ->body(
                            $batch->failed_items > 0
                                ? "{$batch->failed_items} livre(s) ont échoué. Les livres créés restent en brouillon avec droits à vérifier."
                                : 'Tous les livres ont été créés en brouillon, gratuits par défaut, avec droits à vérifier.'
                        );

                    $batch->failed_items > 0
                        ? $notification->warning()->send()
                        : $notification->success()->send();
                }),
            Action::make('bulkImport')
                ->label('Importer jusqu’à 10 PDF (même auteur)')
                ->icon('heroicon-o-arrow-up-tray')
                ->color('primary')
                ->schema([
                    Select::make('author_id')
                        ->label('Auteur principal')
                        ->options(fn (): array => AuthorProfile::query()
                            ->orderBy('display_name')
                            ->pluck('display_name', 'id')
                            ->all())
                        ->searchable()
                        ->required(),
                    FileUpload::make('files')
                        ->label('Livres PDF')
                        ->disk('books')
                        ->directory('admin-imports')
                        ->visibility('private')
                        ->multiple()
                        ->minFiles(1)
                        ->maxFiles(10)
                        ->acceptedFileTypes(['application/pdf'])
                        ->maxSize(460800)
                        ->getUploadedFileNameForStorageUsing(function (TemporaryUploadedFile $file): string {
                            $title = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME));

                            return Str::uuid().'--'.($title !== '' ? $title : 'livre').'.pdf';
                        })
                        ->helperText('Maximum 10 PDF de 450 Mo chacun. Utilisez plutôt le lot préparé pour des auteurs différents.')
                        ->required(),
                    Checkbox::make('rights_confirmed')
                        ->label('Je confirme que la plateforme dispose des droits nécessaires pour traiter ces fichiers.')
                        ->accepted()
                        ->required(),
                ])
                ->action(function (array $data, AdminBookImportService $importer): void {
                    $administrator = auth()->user()?->profile;
                    abort_unless($administrator?->role === 'admin', 403);

                    $batch = $importer->import(
                        paths: $data['files'] ?? [],
                        author: AuthorProfile::query()->findOrFail($data['author_id']),
                        administrator: $administrator,
                        rightsConfirmed: (bool) ($data['rights_confirmed'] ?? false),
                    );

                    $notification = Notification::make()
                        ->title("Import terminé : {$batch->completed_items} livre(s) créé(s)")
                        ->body($batch->failed_items > 0 ? "{$batch->failed_items} fichier(s) ont échoué. Consultez le lot {$batch->id}." : 'Les livres ont été créés en brouillon.');

                    $batch->failed_items > 0
                        ? $notification->warning()->send()
                        : $notification->success()->send();
                }),
        ];
    }
}
