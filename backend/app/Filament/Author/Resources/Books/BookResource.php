<?php

namespace App\Filament\Author\Resources\Books;

use App\Filament\Author\Resources\Books\Pages\CreateBook;
use App\Filament\Author\Resources\Books\Pages\EditBook;
use App\Filament\Author\Resources\Books\Pages\ListBooks;
use App\Models\Book;
use App\Services\PublicationReadinessService;
use BackedEnum;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Placeholder;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Utilities\Get;
use Filament\Schemas\Components\Utilities\Set;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class BookResource extends Resource
{
    protected static ?string $model = Book::class;

    protected static string | BackedEnum | null $navigationIcon = 'heroicon-o-book-open';

    protected static ?string $navigationLabel = 'Mes livres';

    protected static ?string $modelLabel = 'livre';

    protected static ?string $pluralModelLabel = 'mes livres';

    protected static ?string $recordTitleAttribute = 'title';

    protected static ?int $navigationSort = 1;

    public static function getNavigationGroup(): ?string
    {
        return 'Publication';
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->where('author_id', auth()->id());
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Préparation à la publication')
                ->schema([
                    Placeholder::make('publication_readiness')
                        ->label('Score de préparation')
                        ->content(function (?Book $record): string {
                            if (! $record?->exists) {
                                return 'Complétez les informations du livre pour calculer son score.';
                            }

                            $result = app(PublicationReadinessService::class)->evaluate($record);
                            $blockers = empty($result['blockers']) ? 'Aucun blocage majeur.' : 'À compléter : '.implode(', ', $result['blockers']).'.';

                            return $result['score'].' / 100 — '.$blockers;
                        }),
                ]),

            Section::make('Informations du livre')
                ->columns(2)
                ->schema([
                    TextInput::make('title')->label('Titre')->required()->maxLength(255),
                    TextInput::make('subtitle')->label('Sous-titre')->maxLength(255),
                    TextInput::make('isbn')->label('ISBN')->maxLength(50),
                    TextInput::make('language')->label('Langue')->default('fr')->required()->maxLength(10),
                    TextInput::make('publisher')->label('Éditeur')->default('HolisticBooks')->maxLength(255),
                    TextInput::make('page_count')
                        ->label('Nombre de pages')
                        ->numeric()
                        ->minValue(1)
                        ->helperText('Calculé automatiquement à partir du PDF.'),
                    Textarea::make('description')->label('Description')->rows(7)->columnSpanFull(),
                    Select::make('editorial_pole')
                        ->label('Pôle éditorial')
                        ->options([
                            'general' => 'Catalogue général',
                            'ecclesial' => 'Pôle ecclésial / édition spirituelle',
                            'institutional' => 'Pôle institutionnel',
                            'entrepreneurial' => 'Pôle entrepreneurial',
                        ])
                        ->default('general')
                        ->required(),
                    Select::make('work_type')
                        ->label('Type d’ouvrage')
                        ->options([
                            'book' => 'Livre',
                            'bible' => 'Bible / texte biblique',
                            'theology' => 'Théologie',
                            'devotional' => 'Dévotion / méditation',
                            'sermon' => 'Prédication / sermon',
                            'prayer' => 'Prière / vie spirituelle',
                            'study_guide' => 'Guide d’étude',
                            'academic' => 'Ouvrage académique',
                            'manual' => 'Manuel',
                            'essay' => 'Essai',
                            'novel' => 'Roman',
                            'biography' => 'Biographie',
                            'other' => 'Autre',
                        ])
                        ->default('book')
                        ->required(),
                    TagsInput::make('categories')->label('Catégories')->columnSpanFull(),
                    TagsInput::make('tags')->label('Mots-clés')->columnSpanFull(),
                ]),

            Section::make('Fichiers éditoriaux')
                ->columns(2)
                ->schema([
                    FileUpload::make('cover_url')
                        ->label('Couverture')
                        ->disk('public')
                        ->directory('covers')
                        ->image()
                        ->imageEditor()
                        ->maxSize(10240)
                        ->helperText('Facultative : la première page du PDF sera utilisée automatiquement.'),
                    FileUpload::make('file_url')
                        ->label('Manuscrit PDF / EPUB')
                        ->disk('books')
                        ->directory('catalog')
                        ->visibility('private')
                        ->acceptedFileTypes([
                            'application/pdf',
                            'application/epub+zip',
                            'application/octet-stream',
                        ])
                        ->maxSize(460800)
                        ->helperText('Le manuscrit peut être ajouté maintenant ou plus tard. Maximum 450 Mo.'),
                ]),

            Section::make('Atelier d’écriture')
                ->description('Pilotez votre manuscrit comme un véritable projet éditorial : avancement, objectif, prochaine action et échéance.')
                ->columns(2)
                ->schema([
                    Select::make('writing_status')
                        ->label('État de l’écriture')
                        ->options([
                            'idea' => 'Idée / concept',
                            'outline' => 'Plan / structure',
                            'writing' => 'Rédaction en cours',
                            'self_review' => 'Relecture auteur',
                            'submitted' => 'Soumis à l’équipe éditoriale',
                            'editor_review' => 'En traitement éditorial',
                            'changes_requested' => 'Corrections demandées',
                            'ready_for_layout' => 'Prêt pour mise en page',
                            'completed' => 'Manuscrit finalisé',
                        ])
                        ->default('idea')
                        ->required(),

                    DatePicker::make('editorial_deadline')
                        ->label('Échéance cible'),

                    TextInput::make('target_word_count')
                        ->label('Objectif de mots')
                        ->numeric()
                        ->minValue(1),

                    TextInput::make('current_word_count')
                        ->label('Nombre de mots actuel')
                        ->numeric()
                        ->minValue(0),

                    Textarea::make('next_author_action')
                        ->label('Prochaine action')
                        ->rows(3)
                        ->placeholder('Ex. terminer le chapitre 6, intégrer les remarques de l’éditeur...')
                        ->columnSpanFull(),

                    Textarea::make('author_private_notes')
                        ->label('Notes privées de l’auteur')
                        ->rows(5)
                        ->helperText('Visible dans votre espace auteur, destinée au suivi personnel du projet.')
                        ->columnSpanFull(),

                    Placeholder::make('manuscript_versions')
                        ->label('Versions du manuscrit')
                        ->content(fn (?Book $record): string => $record
                            ? $record->manuscriptVersions()->count().' version(s) archivée(s)'
                            : 'La première version sera créée après l’enregistrement du manuscrit.'),

                    Placeholder::make('editorial_stage_workspace')
                        ->label('Étape maison d’édition')
                        ->content(fn (?Book $record): string => $record?->editorial_stage ?? 'intake'),
                ]),

            Section::make('Droits de lecture accordés')
                ->description('Ces paramètres sont définis par Holistique Books selon votre contrat de droits.')
                ->columns(3)
                ->schema([
                    Placeholder::make('reader_mode_display')
                        ->label('Mode')
                        ->content(fn (?Book $record): string => $record?->reading_access_mode ?? 'standard'),
                    Placeholder::make('download_right_display')
                        ->label('Téléchargement')
                        ->content(fn (?Book $record): string => 'Non autorisé — lecture uniquement sur Holistique Books'),
                    Placeholder::make('print_right_display')
                        ->label('Impression')
                        ->content(fn (?Book $record): string => $record?->allow_print ? 'Autorisée' : 'Non autorisée'),
                    Placeholder::make('copy_right_display')
                        ->label('Copie')
                        ->content(fn (?Book $record): string => $record?->allow_copy ? 'Autorisée' : 'Non autorisée'),
                    Placeholder::make('agreement_reference_display')
                        ->label('Référence accord')
                        ->content(fn (?Book $record): string => $record?->rights_agreement_reference ?: 'Non renseignée')
                        ->columnSpan(2),
                ]),

            Section::make('Prix et disponibilité')
                ->columns(3)
                ->schema([
                    Toggle::make('is_free')
                        ->label('Livre gratuit')
                        ->live()
                        ->dehydrated(false)
                        ->afterStateHydrated(fn (Toggle $component, ?Book $record) => $component->state(
                            $record !== null && $record->is_single_sale_enabled && (float) $record->price <= 0,
                        ))
                        ->afterStateUpdated(function (Set $set, Get $get, bool $state): void {
                            if ($state) {
                                $set('price', 0);
                            } elseif ((float) $get('price') <= 0) {
                                $set('price', null);
                            }
                        }),
                    TextInput::make('price')
                        ->label('Prix')
                        ->numeric()
                        ->minValue(0)
                        ->default(0)
                        ->required()
                        ->disabled(fn (Get $get): bool => (bool) $get('is_free'))
                        ->dehydrated()
                        ->helperText('Mettez 0 ou activez « Livre gratuit ».'),
                    TextInput::make('currency_code')->label('Devise')->default('USD')->required()->maxLength(3),
                    Toggle::make('is_single_sale_enabled')->label('Vente à l’unité')->default(true),
                    Toggle::make('is_subscription_available')->label('Abonnement'),
                ]),

            Section::make('État éditorial')
                ->columns(3)
                ->schema([
                    Placeholder::make('status_display')->label('Publication')->content(fn (?Book $record) => $record?->status ?? 'draft'),
                    Placeholder::make('review_display')->label('Validation')->content(fn (?Book $record) => $record?->review_status ?? 'draft'),
                    Placeholder::make('rights_display')->label('Droits')->content(fn (?Book $record) => $record?->copyright_status ?? 'review'),
                    Placeholder::make('review_note_display')->label('Note de l’équipe')->content(fn (?Book $record) => $record?->review_note ?: 'Aucune note')->columnSpanFull(),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('updated_at', 'desc')
            ->columns([
                TextColumn::make('title')->label('Titre')->searchable()->sortable()->limit(50),
                TextColumn::make('price')->label('Prix')->money(fn (Book $record): string => $record->currency_code),
                TextColumn::make('status')->label('Publication')->badge(),
                TextColumn::make('review_status')->label('Validation')->badge(),
                TextColumn::make('copyright_status')->label('Droits')->badge(),
                IconColumn::make('is_subscription_available')->label('Abonnement')->boolean(),
                TextColumn::make('purchases_count')->label('Ventes')->numeric()->sortable(),
                TextColumn::make('views_count')->label('Vues réelles')->numeric()->sortable()->toggleable(),
                TextColumn::make('clicks_count')->label('Clics réels')->numeric()->sortable()->toggleable(),
                TextColumn::make('updated_at')->label('Modifié')->since(),
            ])
            ->filters([
                SelectFilter::make('status')->options([
                    'draft' => 'Brouillon',
                    'coming_soon' => 'À venir',
                    'published' => 'Publié',
                    'archived' => 'Archivé',
                ]),
                SelectFilter::make('review_status')->options([
                    'draft' => 'Brouillon',
                    'submitted' => 'Soumis',
                    'approved' => 'Approuvé',
                    'rejected' => 'Rejeté',
                    'changes_requested' => 'Corrections demandées',
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListBooks::route('/'),
            'create' => CreateBook::route('/create'),
            'edit' => EditBook::route('/{record}/edit'),
        ];
    }
}
