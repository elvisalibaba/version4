<?php

namespace App\Filament\Resources\Authors;

use App\Filament\Resources\Authors\Pages\EditAuthorProfile;
use App\Filament\Resources\Authors\Pages\ListAuthorProfiles;
use App\Models\AuthorProfile;
use BackedEnum;
use Filament\Actions\EditAction;
use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class AuthorProfileResource extends Resource
{
    protected static ?string $model = AuthorProfile::class;

    protected static string | BackedEnum | null $navigationIcon = 'heroicon-o-pencil-square';

    protected static ?string $navigationLabel = 'Auteurs';

    protected static ?string $modelLabel = 'auteur';

    protected static ?string $pluralModelLabel = 'auteurs';

    protected static ?string $recordTitleAttribute = 'display_name';

    protected static ?int $navigationSort = 2;

    public static function getNavigationGroup(): ?string
    {
        return 'Utilisateurs';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Profil auteur')
                ->columns(2)
                ->schema([
                    TextInput::make('display_name')->label('Nom public')->required()->maxLength(255),
                    TextInput::make('professional_headline')->label('Titre professionnel')->maxLength(255),
                    TextInput::make('phone')->label('Téléphone')->maxLength(50),
                    TextInput::make('location')->label('Localisation')->maxLength(255),
                    TextInput::make('website')->label('Site web')->url()->maxLength(255),
                    TextInput::make('avatar_url')->label('Avatar URL')->url()->maxLength(2048),
                    TagsInput::make('genres')->label('Genres')->columnSpanFull(),
                    Textarea::make('bio')->label('Biographie')->rows(6)->columnSpanFull(),
                    Textarea::make('publishing_goals')->label('Objectifs de publication')->rows(4)->columnSpanFull(),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('display_name')->label('Auteur')->searchable()->sortable(),
                TextColumn::make('professional_headline')->label('Profil')->limit(45)->toggleable(),
                TextColumn::make('profile.email')->label('E-mail')->searchable()->copyable(),
                TextColumn::make('location')->label('Localisation')->toggleable(),
                TextColumn::make('books_count')->counts('books')->label('Livres')->sortable(),
                TextColumn::make('created_at')->label('Créé le')->dateTime('d/m/Y')->sortable(),
            ])
            ->recordActions([
                EditAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListAuthorProfiles::route('/'),
            'edit' => EditAuthorProfile::route('/{record}/edit'),
        ];
    }
}
