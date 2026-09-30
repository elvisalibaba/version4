<?php

namespace App\Filament\Resources\Ratings;

use App\Filament\Resources\Ratings\Pages\EditRating;
use App\Filament\Resources\Ratings\Pages\ListRatings;
use App\Models\Rating;
use BackedEnum;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;

class RatingResource extends Resource
{
    protected static ?string $model = Rating::class;

    protected static string|BackedEnum|null $navigationIcon = 'heroicon-o-star';

    protected static ?string $navigationLabel = 'Avis & notes';

    protected static ?string $modelLabel = 'avis';

    protected static ?string $pluralModelLabel = 'avis & notes';

    protected static ?int $navigationSort = 6;

    public static function getNavigationGroup(): ?string
    {
        return 'Catalogue';
    }

    public static function canViewAny(): bool
    {
        return auth()->user()?->profile?->role === 'admin';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Avis lecteur')
                ->columns(2)
                ->schema([
                    TextInput::make('profile.name')
                        ->label('Lecteur')
                        ->disabled()
                        ->dehydrated(false),
                    TextInput::make('book.title')
                        ->label('Livre')
                        ->disabled()
                        ->dehydrated(false),
                    TextInput::make('rating')
                        ->label('Note / 5')
                        ->disabled()
                        ->dehydrated(false),
                    Textarea::make('review_text')
                        ->label('Avis')
                        ->rows(6)
                        ->disabled()
                        ->dehydrated(false)
                        ->columnSpanFull(),
                ]),
            Section::make('Modération')
                ->description('Masquer un avis le retire des pages publiques et des agrégats de note sans supprimer le contenu.')
                ->schema([
                    Toggle::make('is_hidden')
                        ->label('Masquer cet avis'),
                    Textarea::make('moderation_note')
                        ->label('Note interne de modération')
                        ->rows(4)
                        ->maxLength(5000),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                TextColumn::make('book.title')->label('Livre')->searchable()->limit(35),
                TextColumn::make('profile.name')->label('Lecteur')->searchable(),
                TextColumn::make('rating')->label('Note')->formatStateUsing(fn ($state): string => number_format((float) $state, 1, ',', ' ').'/5')->sortable(),
                TextColumn::make('review_text')->label('Avis')->limit(70)->placeholder('Note sans commentaire'),
                IconColumn::make('is_hidden')->label('Masqué')->boolean(),
                TextColumn::make('helpful_count')->label('Utile')->numeric()->sortable(),
                TextColumn::make('created_at')->label('Publié le')->dateTime('d/m/Y H:i')->sortable(),
            ])
            ->filters([
                TernaryFilter::make('is_hidden')
                    ->label('Modération')
                    ->placeholder('Tous')
                    ->trueLabel('Masqués')
                    ->falseLabel('Visibles'),
            ])
            ->recordActions([
                EditAction::make()->label('Modérer'),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListRatings::route('/'),
            'edit' => EditRating::route('/{record}/edit'),
        ];
    }
}
