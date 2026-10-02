<?php

namespace App\Filament\Resources\Authors;

use App\Filament\Resources\Authors\Pages\CreateAuthorProfile;
use App\Filament\Resources\Authors\Pages\EditAuthorProfile;
use App\Filament\Resources\Authors\Pages\ListAuthorProfiles;
use App\Models\AuthorProfile;
use BackedEnum;
use Filament\Actions\EditAction;
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
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class AuthorProfileResource extends Resource
{
    protected static ?string $model = AuthorProfile::class;
    protected static string|BackedEnum|null $navigationIcon = 'heroicon-o-pencil-square';
    protected static ?string $navigationLabel = 'Auteurs';
    protected static ?string $modelLabel = 'auteur';
    protected static ?string $pluralModelLabel = 'auteurs';
    protected static ?string $recordTitleAttribute = 'display_name';
    protected static ?int $navigationSort = 2;
    public static function getNavigationGroup(): ?string { return 'Utilisateurs'; }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Profil auteur')->columns(2)->schema([
                TextInput::make('display_name')->label('Nom public')->required()->maxLength(255),
                TextInput::make('professional_headline')->label('Titre professionnel')->maxLength(255),
                TextInput::make('phone')->label('Téléphone')->maxLength(50),
                TextInput::make('location')->label('Localisation')->maxLength(255),
                TextInput::make('country_code')->label('Pays (ISO)')->maxLength(2),
                TextInput::make('website')->label('Site web')->url()->maxLength(2048),
                FileUpload::make('avatar_url')
                    ->label('Photo / avatar')
                    ->disk('public')
                    ->directory('avatars/authors')
                    ->visibility('public')
                    ->image()
                    ->acceptedFileTypes(['image/jpeg', 'image/png', 'image/webp'])
                    ->maxSize(5120)
                    ->helperText('Importez directement la photo de l’auteur. Les anciennes URL restent compatibles.')
                    ->columnSpanFull(),
                TagsInput::make('genres')->label('Genres')->columnSpanFull(),
                Textarea::make('bio')->label('Biographie')->rows(6)->columnSpanFull(),
                Textarea::make('publishing_goals')->label('Objectifs de publication')->rows(4)->columnSpanFull(),
            ]),
            Section::make('Catalogue & droits')->description('Les auteurs internationaux de référence sont des prospects éditoriaux. Aucun droit de publication n’est présumé.')->columns(2)->schema([
                Select::make('catalog_origin')->label('Origine')->options([
                    'platform'=>'Auteur plateforme',
                    'publisher_catalog'=>'Catalogue maison',
                    'international_reference'=>'Référence internationale',
                ])->default('platform')->required(),
                Select::make('rights_status')->label('Statut des droits')->options([
                    'unknown'=>'À déterminer',
                    'not_acquired'=>'Non acquis',
                    'negotiating'=>'En négociation',
                    'acquired'=>'Acquis',
                    'expired'=>'Expiré',
                    'blocked'=>'Bloqué',
                ])->default('unknown')->required(),
                Toggle::make('is_reference_profile')->label('Profil de référence'),
                TextInput::make('reference_source_url')->label('Source de référence')->url()->columnSpanFull(),
                Textarea::make('rights_notes')->label('Notes droits / agent / éditeur')->rows(4)->columnSpanFull(),
            ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            ImageColumn::make('avatar_url')->label('Photo')->disk('public')->circular(),
            TextColumn::make('display_name')->label('Auteur')->searchable()->sortable(),
            IconColumn::make('profile.id')->label('Compte')->boolean()->getStateUsing(fn(AuthorProfile $record):bool=>$record->profile()->exists()),
            TextColumn::make('catalog_origin')->label('Origine')->badge(),
            TextColumn::make('rights_status')->label('Droits')->badge(),
            TextColumn::make('profile.email')->label('E-mail')->placeholder('Auteur catalogue')->searchable()->copyable(),
            TextColumn::make('country_code')->label('Pays'),
            TextColumn::make('books_count')->counts('books')->label('Livres')->sortable(),
        ])->filters([
            SelectFilter::make('catalog_origin')->options([
                'platform'=>'Plateforme','publisher_catalog'=>'Catalogue maison','international_reference'=>'Référence internationale',
            ]),
            SelectFilter::make('rights_status')->options([
                'unknown'=>'À déterminer','not_acquired'=>'Non acquis','negotiating'=>'Négociation','acquired'=>'Acquis','expired'=>'Expiré','blocked'=>'Bloqué',
            ]),
        ])->recordActions([EditAction::make()]);
    }

    public static function getPages(): array
    {
        return ['index'=>ListAuthorProfiles::route('/'),'create'=>CreateAuthorProfile::route('/create'),'edit'=>EditAuthorProfile::route('/{record}/edit')];
    }
}
