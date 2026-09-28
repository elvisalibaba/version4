<?php

namespace App\Filament\Resources\Books;

use App\Filament\Resources\Books\Pages\CreateBook;
use App\Filament\Resources\Books\Pages\EditBook;
use App\Filament\Resources\Books\Pages\ListBooks;
use App\Models\Book;
use BackedEnum;
use Filament\Actions\EditAction;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

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

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Identité du livre')
                ->columns(2)
                ->schema([
                    TextInput::make('title')->label('Titre')->required()->maxLength(255),
                    TextInput::make('subtitle')->label('Sous-titre')->maxLength(255),
                    Select::make('author_id')
                        ->label('Auteur principal')
                        ->relationship('author', 'display_name')
                        ->searchable()
                        ->preload()
                        ->required(),
                    TextInput::make('author_display_name')->label('Nom auteur affiché')->maxLength(255),
                    TextInput::make('isbn')->label('ISBN')->maxLength(50),
                    TextInput::make('language')->label('Langue')->default('fr')->maxLength(10),
                    TextInput::make('publisher')->label('Éditeur')->maxLength(255),
                    DatePicker::make('publication_date')->label('Date de publication'),
                    Textarea::make('description')->label('Description')->rows(6)->columnSpanFull(),
                    TagsInput::make('categories')->label('Catégories')->columnSpanFull(),
                    TagsInput::make('tags')->label('Tags')->columnSpanFull(),
                ]),

            Section::make('Commercialisation')
                ->columns(3)
                ->schema([
                    TextInput::make('price')->label('Prix')->numeric()->minValue(0)->default(0)->required(),
                    TextInput::make('currency_code')->label('Devise')->default('USD')->maxLength(3)->required(),
                    Select::make('status')
                        ->label('Statut')
                        ->options([
                            'draft' => 'Brouillon',
                            'published' => 'Publié',
                            'archived' => 'Archivé',
                            'coming_soon' => 'À venir',
                        ])
                        ->default('draft')
                        ->required(),
                    Toggle::make('is_single_sale_enabled')->label('Vente individuelle')->default(true),
                    Toggle::make('is_subscription_available')->label('Disponible par abonnement'),
                    TextInput::make('page_count')->label('Nombre de pages')->numeric()->minValue(1),
                ]),

            Section::make('Fichiers')
                ->columns(2)
                ->schema([
                    FileUpload::make('cover_url')
                        ->label('Couverture')
                        ->disk('public')
                        ->directory('covers')
                        ->image()
                        ->imageEditor()
                        ->maxSize(10240),
                    FileUpload::make('file_url')
                        ->label('PDF / EPUB privé')
                        ->disk('books')
                        ->directory('catalog')
                        ->visibility('private')
                        ->acceptedFileTypes([
                            'application/pdf',
                            'application/epub+zip',
                            'application/octet-stream',
                        ])
                        ->maxSize(204800),
                ]),

            Section::make('Validation éditoriale et droits')
                ->columns(2)
                ->schema([
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
                    Select::make('copyright_status')
                        ->label('Droits')
                        ->options([
                            'clear' => 'Droits validés',
                            'review' => 'À vérifier',
                            'blocked' => 'Bloqué',
                        ])
                        ->default('review')
                        ->required(),
                    Textarea::make('review_note')->label('Note éditoriale')->rows(3),
                    Textarea::make('copyright_note')->label('Note copyright')->rows(3),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                TextColumn::make('title')->label('Titre')->searchable()->sortable()->limit(45),
                TextColumn::make('author.display_name')->label('Auteur')->searchable()->toggleable(),
                TextColumn::make('price')->label('Prix')->money(fn (Book $record): string => $record->currency_code)->sortable(),
                TextColumn::make('status')->label('Statut')->badge()->sortable(),
                TextColumn::make('review_status')->label('Éditorial')->badge()->toggleable(),
                TextColumn::make('copyright_status')->label('Droits')->badge()->toggleable(),
                IconColumn::make('is_subscription_available')->label('Abonnement')->boolean(),
                TextColumn::make('purchases_count')->label('Achats')->numeric()->sortable()->toggleable(),
                TextColumn::make('created_at')->label('Créé le')->dateTime('d/m/Y H:i')->sortable()->toggleable(isToggledHiddenByDefault: true),
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
