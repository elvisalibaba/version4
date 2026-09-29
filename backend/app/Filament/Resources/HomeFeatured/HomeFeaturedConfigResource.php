<?php

namespace App\Filament\Resources\HomeFeatured;

use App\Filament\Resources\HomeFeatured\Pages\CreateHomeFeaturedConfig;
use App\Filament\Resources\HomeFeatured\Pages\EditHomeFeaturedConfig;
use App\Filament\Resources\HomeFeatured\Pages\ListHomeFeaturedConfigs;
use App\Models\Book;
use App\Models\HomeFeaturedConfig;
use BackedEnum;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Select;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class HomeFeaturedConfigResource extends Resource
{
    protected static ?string $model = HomeFeaturedConfig::class;

    protected static string | BackedEnum | null $navigationIcon = 'heroicon-o-star';

    protected static ?string $navigationLabel = 'Sélection accueil';

    protected static ?string $modelLabel = 'sélection';

    protected static ?string $pluralModelLabel = 'sélections accueil';

    protected static ?string $recordTitleAttribute = 'scope';

    protected static ?int $navigationSort = 3;

    public static function getNavigationGroup(): ?string
    {
        return 'Contenu';
    }

    public static function canCreate(): bool
    {
        return ! HomeFeaturedConfig::query()->whereKey('global')->exists();
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Livres mis en avant')
                ->schema([
                    Select::make('selected_book_ids')
                        ->label('Ordre de mise en avant')
                        ->multiple()
                        ->searchable()
                        ->preload()
                        ->options(fn (): array => Book::query()
                            ->where('status', 'published')
                            ->where('copyright_status', 'clear')
                            ->orderBy('title')
                            ->pluck('title', 'id')
                            ->all())
                        ->helperText('L’ordre enregistré est utilisé pour la sélection affichée sur l’accueil.'),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('scope')->label('Portée'),
                TextColumn::make('selected_book_ids')->label('Livres')->formatStateUsing(fn ($state) => is_array($state) ? count($state).' sélectionné(s)' : '0'),
                TextColumn::make('updated_at')->label('Mise à jour')->dateTime('d/m/Y H:i'),
            ])
            ->recordActions([
                EditAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListHomeFeaturedConfigs::route('/'),
            'create' => CreateHomeFeaturedConfig::route('/create'),
            'edit' => EditHomeFeaturedConfig::route('/{record}/edit'),
        ];
    }
}
