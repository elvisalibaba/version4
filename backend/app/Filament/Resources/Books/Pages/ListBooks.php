<?php

namespace App\Filament\Resources\Books\Pages;

use App\Filament\Resources\Books\BookResource;
use App\Models\AuthorProfile;
use App\Models\Book;
use App\Services\AdminBookImportService;
use App\Services\AdminBookPublicationService;
use App\Services\BookDocumentMetadataService;
use Filament\Actions\Action;
use Filament\Actions\CreateAction;
use Filament\Forms\Components\Checkbox;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\ListRecords;
use Illuminate\Support\Str;
use Livewire\Features\SupportFileUploads\TemporaryUploadedFile;
use Throwable;

class ListBooks extends ListRecords
{
    protected static string $resource = BookResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make()
                ->label('Ajouter un livre')
                ->icon('heroicon-o-plus'),

            Action::make('repairMissingCovers')
                ->label('Réparer les covers')
                ->icon('heroicon-o-photo')
                ->color('gray')
                ->requiresConfirmation()
                ->modalHeading('Générer les couvertures manquantes')
                ->modalDescription('Le système traite jusqu’à 100 livres sans couverture : première page du PDF si possible, sinon couverture Holistique Books générée automatiquement.')
                ->action(function (BookDocumentMetadataService $metadata): void {
                    $books = Book::query()
                        ->where(function ($query): void {
                            $query->whereNull('cover_url')->orWhere('cover_url', '');
                        })
                        ->orderBy('created_at')
                        ->limit(100)
                        ->get();

                    $repaired = 0;
                    $failed = 0;

                    foreach ($books as $book) {
                        try {
                            $book = $metadata->enrich($book);
                            filled($book->cover_url) ? $repaired++ : $failed++;
                        } catch (Throwable) {
                            $failed++;
                        }
                    }

                    Notification::make()
                        ->title("Covers réparées : {$repaired}")
                        ->body($failed > 0 ? "{$failed} livre(s) restent à vérifier." : 'Tous les livres traités disposent maintenant d’une couverture.')
                        ->success()
                        ->send();
                }),

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
                ->label('Importer un lot ZIP (jusqu’à 50)')
                ->icon('heroicon-o-archive-box-arrow-down')
                ->color('success')
                ->schema([
                    FileUpload::make('archive')
                        ->label('Lot de livres ZIP')
                        ->disk('books')
                        ->directory('admin-imports/prepared')
                        ->visibility('private')
                        ->acceptedFileTypes(['application/zip', 'application/x-zip-compressed', 'multipart/x-zip'])
                        ->maxSize(460800)
                        ->getUploadedFileNameForStorageUsing(fn (TemporaryUploadedFile $file): string => Str::uuid().'-lot-holistique-books.zip')
                        ->helperText('Le ZIP peut contenir manifest.json, catalogue.csv, ou simplement books/. covers/ est facultatif : le système associe les covers par nom ou en génère automatiquement.')
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
                        ->title("Lot traité : {$batch->completed_items} livre(s) créé(s)")
                        ->body(
                            $batch->failed_items > 0
                                ? "{$batch->failed_items} fichier(s) réellement invalides n’ont pas été ingérés. Les métadonnées facultatives ne bloquent plus l’import."
                                : 'Tous les livres ont été créés. Les données manquantes peuvent être enrichies ensuite dans l’administration.'
                        );

                    $batch->failed_items > 0
                        ? $notification->warning()->send()
                        : $notification->success()->send();
                }),

            Action::make('bulkImport')
                ->label('Import rapide jusqu’à 50 fichiers')
                ->icon('heroicon-o-arrow-up-tray')
                ->color('primary')
                ->schema([
                    Select::make('author_id')
                        ->label('Auteur commun')
                        ->options(fn (): array => AuthorProfile::query()
                            ->orderBy('display_name')
                            ->pluck('display_name', 'id')
                            ->all())
                        ->searchable()
                        ->nullable()
                        ->helperText('Facultatif. Laissez vide pour des ouvrages anonymes, collectifs ou à compléter plus tard.'),

                    FileUpload::make('files')
                        ->label('Livres / manuscrits')
                        ->disk('books')
                        ->directory('admin-imports')
                        ->visibility('private')
                        ->multiple()
                        ->minFiles(1)
                        ->maxFiles(50)
                        ->acceptedFileTypes([
                            'application/pdf',
                            'application/epub+zip',
                            'application/vnd.amazon.ebook',
                            'application/x-mobipocket-ebook',
                            'application/octet-stream',
                        ])
                        ->maxSize(460800)
                        ->getUploadedFileNameForStorageUsing(function (TemporaryUploadedFile $file): string {
                            $title = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME));
                            $extension = mb_strtolower($file->getClientOriginalExtension() ?: 'pdf');

                            return Str::uuid().'--'.($title !== '' ? $title : 'livre').'.'.$extension;
                        })
                        ->helperText('Maximum 50 fichiers de 450 Mo chacun. PDF et EPUB sont directement pris en charge ; les autres formats sont conservés comme sources éditoriales.')
                        ->required(),

                    Checkbox::make('rights_confirmed')
                        ->label('Les droits sont déjà validés pour ce lot.')
                        ->helperText('Facultatif. Si non coché, les livres sont tout de même importés avec le statut « Droits à vérifier ».'),
                ])
                ->action(function (array $data, AdminBookImportService $importer): void {
                    $administrator = auth()->user()?->profile;
                    abort_unless($administrator?->role === 'admin', 403);

                    $author = filled($data['author_id'] ?? null)
                        ? AuthorProfile::query()->find($data['author_id'])
                        : null;

                    $batch = $importer->import(
                        paths: $data['files'] ?? [],
                        author: $author,
                        administrator: $administrator,
                        rightsConfirmed: (bool) ($data['rights_confirmed'] ?? false),
                    );

                    $notification = Notification::make()
                        ->title("Import terminé : {$batch->completed_items} livre(s) créé(s)")
                        ->body(
                            $batch->failed_items > 0
                                ? "{$batch->failed_items} fichier(s) ont échoué. Consultez le lot {$batch->id}."
                                : 'Tous les fichiers ont été intégrés au catalogue.'
                        );

                    $batch->failed_items > 0
                        ? $notification->warning()->send()
                        : $notification->success()->send();
                }),
        ];
    }
}
