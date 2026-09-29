<?php

namespace App\Filament\Resources\Books\Pages;

use App\Filament\Resources\Books\BookResource;
use App\Models\AuthorProfile;
use App\Services\AdminBookImportService;
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
            Action::make('bulkImport')
                ->label('Importer jusqu’à 10 PDF')
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
                        ->maxSize(204800)
                        ->getUploadedFileNameForStorageUsing(function (TemporaryUploadedFile $file): string {
                            $title = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME));

                            return Str::uuid().'--'.($title !== '' ? $title : 'livre').'.pdf';
                        })
                        ->helperText('Maximum 10 PDF de 200 Mo chacun. Le titre, le nombre de pages et la couverture seront préparés automatiquement.')
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
