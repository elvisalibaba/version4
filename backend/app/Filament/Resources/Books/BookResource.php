<?php

namespace App\Filament\Resources\Books;

use App\Filament\Resources\Books\Pages\CreateBook;
use App\Filament\Resources\Books\Pages\EditBook;
use App\Filament\Resources\Books\Pages\ListBooks;
use App\Models\AcademicTaxonomy;
use App\Support\StaffAccess;
use App\Models\AuthorProfile;
use App\Models\Book;
use App\Models\Category;
use App\Services\AdminBookPublicationService;
use BackedEnum;
use Filament\Actions\BulkAction;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Checkbox;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Utilities\Get;
use Filament\Schemas\Components\Utilities\Set;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Collection;

class BookResource extends Resource
{
    protected static ?string $model = Book::class;

    protected static string | BackedEnum | null $navigationIcon = 'heroicon-o-book-open';

    protected static ?string $navigationLabel = 'Livres';

    protected static ?string $modelLabel = 'livre';

    protected static ?string $pluralModelLabel = 'livres';

    protected static ?string $recordTitleAttribute = 'title';

    protected static ?int $navigationSort = 1;

    public static function getNavigationGroup(): ?string
    {
        return 'Catalogue';
    }

    public static function canViewAny(): bool
    {
        return StaffAccess::allows('catalog.view') || StaffAccess::allows('catalog.manage');
    }

    public static function canCreate(): bool
    {
        return StaffAccess::allows('catalog.manage');
    }

    public static function canEdit($record): bool
    {
        return StaffAccess::allows('catalog.manage');
    }

    public static function canDelete($record): bool
    {
        return StaffAccess::allows('catalog.manage');
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Identité du livre')
                ->description('Seul le titre est indispensable. Un ouvrage peut être anonyme, collectif, institutionnel ou être un texte sacré sans auteur lié.')
                ->columns(2)
                ->schema([
                    TextInput::make('title')
                        ->label('Titre')
                        ->required()
                        ->maxLength(255),

                    TextInput::make('subtitle')
                        ->label('Sous-titre')
                        ->maxLength(255),

                    Select::make('authorship_type')
                        ->label('Type d’attribution')
                        ->options([
                            'named' => 'Auteur identifié',
                            'collective' => 'Collectif',
                            'institutional' => 'Institution / organisation',
                            'anonymous' => 'Anonyme / non attribué',
                            'traditional' => 'Tradition / attribution historique',
                            'sacred_text' => 'Texte sacré',
                        ])
                        ->default('named')
                        ->required()
                        ->live(),

                    Select::make('author_id')
                        ->label('Auteur du catalogue')
                        ->relationship('author', 'display_name')
                        ->searchable()
                        ->preload()
                        ->nullable()
                        ->helperText('Facultatif. Laissez vide pour une Bible, un ouvrage collectif, institutionnel ou anonyme.')
                        ->createOptionAction(fn ($action) => $action
                            ->label('Créer un nouvel auteur')
                            ->modalHeading('Ajouter un auteur au catalogue')
                            ->modalSubmitActionLabel('Créer et sélectionner'))
                        ->createOptionForm([
                            TextInput::make('display_name')
                                ->label('Nom public de l’auteur')
                                ->required()
                                ->maxLength(255),
                            TextInput::make('professional_headline')
                                ->label('Présentation courte')
                                ->maxLength(255),
                            TextInput::make('phone')
                                ->label('Téléphone')
                                ->maxLength(50),
                            TextInput::make('location')
                                ->label('Localisation')
                                ->maxLength(255),
                            TextInput::make('website')
                                ->label('Site web')
                                ->url()
                                ->maxLength(255),
                            TagsInput::make('genres')->label('Genres'),
                            Textarea::make('bio')->label('Biographie')->rows(5),
                        ])
                        ->createOptionUsing(function (array $data): string {
                            $author = AuthorProfile::query()->create([
                                ...$data,
                                'genres' => $data['genres'] ?? [],
                                'social_links' => [],
                                'press_mentions' => [],
                                'catalog_origin' => 'admin_catalog',
                                'rights_status' => 'unknown',
                                'is_reference_profile' => false,
                            ]);

                            return (string) $author->getKey();
                        })
                        ->live()
                        ->afterStateUpdated(function (Set $set, ?string $state): void {
                            $name = $state ? AuthorProfile::query()->find($state)?->display_name : null;

                            if ($name) {
                                $set('author_credit', $name);
                            }
                        }),

                    TextInput::make('author_credit')
                        ->label('Crédit auteur affiché')
                        ->maxLength(255)
                        ->placeholder('Ex. Collectif, Église X, Texte sacré, Jean Dupont')
                        ->helperText('Le texte réellement affiché au lecteur. Facultatif.')
                        ->afterStateHydrated(function (TextInput $component, ?Book $record): void {
                            if ($record && blank($component->getState())) {
                                $component->state($record->author_credit ?: $record->author_display_name);
                            }
                        }),

                    TextInput::make('isbn')
                        ->label('ISBN')
                        ->maxLength(50),

                    TextInput::make('language')
                        ->label('Langue')
                        ->default('fr')
                        ->maxLength(10),

                    TextInput::make('publisher')
                        ->label('Éditeur affiché')
                        ->default('Holistique Books')
                        ->maxLength(255),

                    Select::make('publishing_house_id')
                        ->relationship('publishingHouse', 'name')
                        ->label('Maison d’édition')
                        ->searchable()
                        ->preload()
                        ->nullable(),

                    Select::make('imprint_id')
                        ->relationship('imprint', 'name')
                        ->label('Label / Imprint')
                        ->searchable()
                        ->preload()
                        ->nullable(),

                    DatePicker::make('publication_date')
                        ->label('Date de publication'),

                    TextInput::make('edition')
                        ->label('Édition / version')
                        ->maxLength(255)
                        ->placeholder('Ex. 2e édition, Édition révisée, Louis Segond 1910'),

                    TextInput::make('series_name')
                        ->label('Collection / série')
                        ->maxLength(255),

                    TextInput::make('series_position')
                        ->label('N° dans la série')
                        ->numeric()
                        ->minValue(1),

                    Textarea::make('description')
                        ->label('Description')
                        ->rows(6)
                        ->columnSpanFull(),

                    Select::make('categories')
                        ->label('Catégories')
                        ->multiple()
                        ->searchable()
                        ->preload()
                        ->options(fn () => Category::query()
                            ->where('is_active', true)
                            ->orderBy('sort_order')
                            ->pluck('name', 'name')
                            ->all())
                        ->columnSpanFull(),

                    TagsInput::make('tags')
                        ->label('Mots-clés')
                        ->columnSpanFull(),
                ]),

            Section::make('Positionnement éditorial')
                ->description('Classement interne aligné sur les pôles Holistique Books : général, ecclésial, institutionnel et entrepreneurial.')
                ->columns(3)
                ->schema([
                    Select::make('editorial_pole')
                        ->label('Pôle éditorial')
                        ->options([
                            'general' => 'Catalogue général',
                            'ecclesial' => 'Pôle ecclésial / édition spirituelle',
                            'institutional' => 'Pôle institutionnel',
                            'entrepreneurial' => 'Pôle entrepreneurial',
                        ])
                        ->default('general')
                        ->required()
                        ->live(),

                    Select::make('work_type')
                        ->label('Type d’ouvrage')
                        ->options([
                            'book' => 'Livre',
                            'bible' => 'Bible / texte biblique',
                            'theology' => 'Théologie',
                            'devotional' => 'Dévotion / méditation',
                            'sermon' => 'Prédication / sermon',
                            'prayer' => 'Prière / vie spirituelle',
                            'hymnal' => 'Recueil de chants / hymnes',
                            'study_guide' => 'Guide d’étude',
                            'academic' => 'Ouvrage académique',
                            'manual' => 'Manuel / guide pratique',
                            'essay' => 'Essai',
                            'novel' => 'Roman',
                            'biography' => 'Biographie / mémoires',
                            'magazine' => 'Magazine',
                            'report' => 'Rapport / publication institutionnelle',
                            'other' => 'Autre',
                        ])
                        ->default('book')
                        ->required()
                        ->live(),

                    TextInput::make('age_rating')
                        ->label('Public / âge')
                        ->maxLength(30),
                ]),

            Section::make('Édition spirituelle / ecclésiale')
                ->description('Métadonnées facultatives pour Bibles, théologie, dévotion, prédication, prière et ouvrages de ministère.')
                ->columns(2)
                ->visible(fn (Get $get): bool => $get('editorial_pole') === 'ecclesial'
                    || in_array($get('work_type'), ['bible', 'theology', 'devotional', 'sermon', 'prayer', 'hymnal', 'study_guide'], true))
                ->schema([
                    TextInput::make('spiritual_metadata.tradition')
                        ->label('Tradition / courant')
                        ->placeholder('Ex. chrétienne, protestante, catholique, évangélique'),

                    TextInput::make('spiritual_metadata.denomination')
                        ->label('Dénomination / ministère')
                        ->placeholder('Facultatif'),

                    TextInput::make('spiritual_metadata.bible_translation')
                        ->label('Traduction biblique')
                        ->placeholder('Ex. Louis Segond 1910, TOB, Bible de Jérusalem'),

                    Select::make('spiritual_metadata.testament')
                        ->label('Portée biblique')
                        ->options([
                            'old' => 'Ancien Testament',
                            'new' => 'Nouveau Testament',
                            'both' => 'Bible complète',
                            'na' => 'Non applicable',
                        ]),

                    TextInput::make('spiritual_metadata.scripture_reference')
                        ->label('Référence / corpus')
                        ->placeholder('Ex. Psaumes, Évangiles, épîtres'),

                    TextInput::make('spiritual_metadata.target_audience')
                        ->label('Public spirituel')
                        ->placeholder('Ex. pasteurs, étudiants en théologie, fidèles, jeunesse'),

                    TagsInput::make('spiritual_metadata.topics')
                        ->label('Thèmes spirituels')
                        ->columnSpanFull(),
                ]),

            Section::make('Éducation scolaire et universitaire')
                ->description('Classement académique facultatif.')
                ->schema([
                    Select::make('educationTaxonomies')
                        ->label('Public académique ciblé')
                        ->relationship('educationTaxonomies', 'name')
                        ->multiple()
                        ->searchable()
                        ->preload()
                        ->getOptionLabelFromRecordUsing(fn (AcademicTaxonomy $record): string => sprintf(
                            '%s · %s · %s',
                            $record->audience === 'university' ? 'Université' : 'Scolaire',
                            match ($record->kind) {
                                'class' => 'Classe',
                                'stream' => 'Filière',
                                'section' => 'Section',
                                'option' => 'Option',
                                'cycle' => 'Cycle',
                                'domain' => 'Domaine',
                                'field' => 'Filière',
                                'mention' => 'Mention',
                                default => 'Niveau',
                            },
                            $record->name,
                        ))
                        ->columnSpanFull(),
                ]),

            Section::make('Fichiers et couverture')
                ->description('La couverture est toujours garantie : upload manuel en priorité, sinon première page du PDF, sinon couverture de secours générée automatiquement.')
                ->columns(2)
                ->schema([
                    FileUpload::make('cover_url')
                        ->label('Couverture')
                        ->disk('public')
                        ->directory('covers')
                        ->image()
                        ->imageEditor()
                        ->maxSize(20480)
                        ->helperText('JPG, PNG ou WebP. Facultatif : le système génère automatiquement une couverture si vous n’en fournissez pas.'),

                    FileUpload::make('file_url')
                        ->label('Fichier principal / manuscrit')
                        ->disk('books')
                        ->directory('catalog')
                        ->visibility('private')
                        ->acceptedFileTypes([
                            'application/pdf',
                            'application/epub+zip',
                            'application/vnd.amazon.ebook',
                            'application/x-mobipocket-ebook',
                            'application/octet-stream',
                            'application/msword',
                            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        ])
                        ->maxSize(460800)
                        ->helperText('Jusqu’à 450 Mo. Le catalogue peut être créé même si le fichier final n’est pas encore disponible.'),

                    TextInput::make('page_count')
                        ->label('Nombre de pages')
                        ->numeric()
                        ->minValue(1)
                        ->helperText('Calculé automatiquement pour les PDF quand le serveur le permet.'),

                    TextInput::make('file_format')
                        ->label('Format détecté')
                        ->disabled()
                        ->dehydrated(),
                ]),

            Section::make('Chaîne éditoriale')
                ->description('Suivi de production jusqu’au BAT, à l’impression/diffusion et à la publication.')
                ->columns(3)
                ->schema([
                    Select::make('editorial_stage')
                        ->label('Étape éditoriale')
                        ->options([
                            'intake' => '01 · Collecte / réception',
                            'brief' => '02 · Brief / diagnostic',
                            'contract' => '03 · Contrat / cadrage',
                            'planning' => '04 · Planification',
                            'writing' => '05 · Rédaction / manuscrit',
                            'correction_1' => '06 · Première correction',
                            'correction_2' => '07 · Seconde relecture',
                            'layout' => '08 · Mise en page',
                            'design' => '09 · Design / couverture',
                            'bat' => '10 · Bon à tirer (BAT)',
                            'production' => '11 · Production / impression',
                            'distribution' => '12 · Diffusion / distribution',
                            'published' => '13 · Publié / suivi',
                        ])
                        ->default('intake')
                        ->required(),

                    Select::make('review_status')
                        ->label('Validation éditoriale')
                        ->options([
                            'draft' => 'Brouillon',
                            'submitted' => 'Soumis',
                            'approved' => 'Approuvé',
                            'rejected' => 'Rejeté',
                            'changes_requested' => 'Corrections demandées',
                        ])
                        ->default('draft')
                        ->required(),

                    Select::make('bat_status')
                        ->label('BAT')
                        ->options([
                            'pending' => 'En attente',
                            'in_review' => 'En contrôle',
                            'approved' => 'BAT approuvé',
                            'rejected' => 'BAT refusé / à corriger',
                        ])
                        ->default('pending')
                        ->required(),

                    Textarea::make('review_note')
                        ->label('Note éditoriale')
                        ->rows(3)
                        ->columnSpanFull(),
                ]),

            Section::make('Droits de lecture & protection')
                ->description('Séparez clairement le droit de lire sur Holistique Books des droits de téléchargement, impression et copie prévus au contrat.')
                ->columns(3)
                ->schema([
                    Select::make('reading_access_mode')
                        ->label('Mode de lecture')
                        ->options([
                            'standard' => 'Standard',
                            'platform_read_only' => 'Lecture Holistique Books uniquement',
                            'licensed_read_only' => 'Lecture sous licence / accord auteur',
                            'preview_only' => 'Aperçu uniquement',
                        ])
                        ->default('standard')
                        ->required()
                        ->live(),

                    Toggle::make('can_read_on_platform')
                        ->label('Lecture sur Holistique Books')
                        ->default(true),

                    Toggle::make('reader_watermark_enabled')
                        ->label('Filigrane lecteur')
                        ->default(false),

                    Toggle::make('allow_download')
                        ->label('Téléchargement')
                        ->default(false)
                        ->disabled()
                        ->dehydrated()
                        ->helperText('Désactivé globalement : aucun livre ne quitte Holistique Books.'),

                    Toggle::make('allow_print')
                        ->label('Impression autorisée')
                        ->default(true),

                    Toggle::make('allow_copy')
                        ->label('Copie du contenu autorisée')
                        ->default(true),

                    TextInput::make('rights_agreement_reference')
                        ->label('Référence contrat / accord')
                        ->maxLength(255)
                        ->placeholder('Ex. HB-RIGHTS-2026-0042'),

                    Textarea::make('reader_rights_note')
                        ->label('Note de licence / restrictions')
                        ->rows(3)
                        ->columnSpan(2)
                        ->placeholder('Ex. Accord international : lecture sur plateforme autorisée, téléchargement et impression interdits.'),
                ]),

            Section::make('Pilotage auteur')
                ->description('Suivi du travail d’écriture visible dans le Studio Auteur.')
                ->columns(3)
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
                    TextInput::make('target_word_count')->label('Objectif mots')->numeric()->minValue(1),
                    TextInput::make('current_word_count')->label('Mots actuels')->numeric()->minValue(0),
                    Textarea::make('next_author_action')->label('Prochaine action auteur')->rows(2)->columnSpan(2),
                    DatePicker::make('editorial_deadline')->label('Échéance'),
                ]),

            Section::make('Commercialisation et publication')
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
                                $set('is_single_sale_enabled', true);
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
                        ->dehydrated(),

                    TextInput::make('currency_code')
                        ->label('Devise')
                        ->default('USD')
                        ->maxLength(3)
                        ->required(),

                    Select::make('status')
                        ->label('Statut public')
                        ->options([
                            'draft' => 'Brouillon',
                            'published' => 'Publié',
                            'archived' => 'Archivé',
                            'coming_soon' => 'À venir',
                        ])
                        ->default('draft')
                        ->required(),

                    Toggle::make('is_single_sale_enabled')
                        ->label('Vente individuelle / lecture gratuite')
                        ->default(true),

                    Toggle::make('is_subscription_available')
                        ->label('Disponible par abonnement'),

                    Select::make('copyright_status')
                        ->label('Droits')
                        ->options([
                            'clear' => 'Droits validés',
                            'review' => 'À vérifier',
                            'blocked' => 'Bloqué',
                        ])
                        ->default('review')
                        ->required(),

                    Textarea::make('copyright_note')
                        ->label('Note droits / copyright')
                        ->rows(3)
                        ->columnSpan(2),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                TextColumn::make('title')
                    ->label('Titre')
                    ->searchable()
                    ->sortable()
                    ->limit(45),

                TextColumn::make('author_credit')
                    ->label('Auteur / crédit')
                    ->formatStateUsing(fn (mixed $state, Book $record): string => $record->displayAuthorName() ?: 'Sans auteur')
                    ->searchable(['author_credit', 'author_display_name'])
                    ->toggleable(),

                TextColumn::make('editorial_pole')
                    ->label('Pôle')
                    ->badge()
                    ->sortable(),

                TextColumn::make('work_type')
                    ->label('Type')
                    ->badge()
                    ->toggleable(),

                TextColumn::make('editorial_stage')
                    ->label('Chaîne éditoriale')
                    ->badge()
                    ->toggleable(),

                TextColumn::make('price')
                    ->label('Prix')
                    ->money(fn (Book $record): string => $record->currency_code)
                    ->sortable(),

                TextColumn::make('status')
                    ->label('Statut')
                    ->badge()
                    ->sortable(),

                TextColumn::make('review_status')
                    ->label('Éditorial')
                    ->badge()
                    ->toggleable(),

                TextColumn::make('copyright_status')
                    ->label('Droits')
                    ->badge()
                    ->toggleable(),

                TextColumn::make('cover_source')
                    ->label('Cover')
                    ->badge()
                    ->toggleable(),

                IconColumn::make('is_subscription_available')
                    ->label('Abonnement')
                    ->boolean(),

                TextColumn::make('purchases_count')
                    ->label('Achats')
                    ->numeric()
                    ->sortable()
                    ->toggleable(),

                TextColumn::make('views_count')
                    ->label('Vues')
                    ->numeric()
                    ->sortable()
                    ->toggleable(),

                TextColumn::make('created_at')
                    ->label('Créé le')
                    ->dateTime('d/m/Y H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->label('Statut')
                    ->options([
                        'draft' => 'Brouillon',
                        'published' => 'Publié',
                        'archived' => 'Archivé',
                        'coming_soon' => 'À venir',
                    ]),

                SelectFilter::make('editorial_pole')
                    ->label('Pôle éditorial')
                    ->options([
                        'general' => 'Catalogue général',
                        'ecclesial' => 'Pôle ecclésial',
                        'institutional' => 'Pôle institutionnel',
                        'entrepreneurial' => 'Pôle entrepreneurial',
                    ]),

                SelectFilter::make('work_type')
                    ->label('Type d’ouvrage')
                    ->options([
                        'book' => 'Livre',
                        'bible' => 'Bible',
                        'theology' => 'Théologie',
                        'devotional' => 'Dévotion',
                        'sermon' => 'Prédication',
                        'prayer' => 'Prière',
                        'study_guide' => 'Guide d’étude',
                        'academic' => 'Académique',
                        'manual' => 'Manuel',
                        'magazine' => 'Magazine',
                    ]),

                SelectFilter::make('editorial_stage')
                    ->label('Étape éditoriale')
                    ->options([
                        'intake' => 'Collecte',
                        'brief' => 'Brief',
                        'contract' => 'Contrat',
                        'planning' => 'Planification',
                        'writing' => 'Rédaction',
                        'correction_1' => 'Première correction',
                        'correction_2' => 'Seconde relecture',
                        'layout' => 'Mise en page',
                        'design' => 'Design',
                        'bat' => 'BAT',
                        'production' => 'Production',
                        'distribution' => 'Distribution',
                        'published' => 'Publié',
                    ]),

                SelectFilter::make('educationTaxonomies')
                    ->relationship('educationTaxonomies', 'name')
                    ->label('Niveau / filière')
                    ->searchable()
                    ->preload(),

                SelectFilter::make('copyright_status')
                    ->label('Droits')
                    ->options([
                        'clear' => 'Validés',
                        'review' => 'À vérifier',
                        'blocked' => 'Bloqués',
                    ]),
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    BulkAction::make('validateAndPublish')
                        ->label('Valider et publier la sélection')
                        ->icon('heroicon-o-check-badge')
                        ->color('warning')
                        ->requiresConfirmation()
                        ->modalHeading('Valider et publier les livres sélectionnés')
                        ->modalDescription('Les livres sélectionnés passeront en Publié, Approuvé et Droits validés. Confirmez uniquement si vous disposez des droits de diffusion nécessaires.')
                        ->schema([
                            Checkbox::make('rights_confirmed')
                                ->label('Je confirme disposer des droits nécessaires pour publier les livres sélectionnés.')
                                ->accepted()
                                ->required(),
                        ])
                        ->action(function (Collection $records, array $data, AdminBookPublicationService $publisher): void {
                            $administrator = auth()->user()?->profile;
                            abort_unless($administrator?->role === 'admin', 403);

                            $result = $publisher->publish(
                                books: $records,
                                administrator: $administrator,
                                rightsConfirmed: (bool) ($data['rights_confirmed'] ?? false),
                            );

                            $notification = Notification::make()
                                ->title("Publication terminée : {$result['published']} livre(s)")
                                ->body(
                                    $result['failed'] > 0
                                        ? "{$result['failed']} livre(s) n’ont pas pu être publiés. Vérifiez leurs droits ou contrats."
                                        : 'Les livres sélectionnés ont été validés et publiés.'
                                );

                            $result['failed'] > 0
                                ? $notification->warning()->send()
                                : $notification->success()->send();
                        }),
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
