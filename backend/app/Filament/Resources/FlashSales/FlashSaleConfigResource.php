<?php

namespace App\Filament\Resources\FlashSales;

use App\Support\StaffAccess;
use App\Filament\Resources\FlashSales\Pages\CreateFlashSaleConfig;
use App\Filament\Resources\FlashSales\Pages\EditFlashSaleConfig;
use App\Filament\Resources\FlashSales\Pages\ListFlashSaleConfigs;
use App\Models\Book;
use App\Models\FlashSaleConfig;
use BackedEnum;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class FlashSaleConfigResource extends Resource
{
    protected static ?string $model = FlashSaleConfig::class;

    protected static string | BackedEnum | null $navigationIcon = 'heroicon-o-bolt';

    protected static ?string $navigationLabel = 'Vente flash';

    protected static ?string $modelLabel = 'configuration';

    protected static ?string $pluralModelLabel = 'ventes flash';

    protected static ?string $recordTitleAttribute = 'scope';

    protected static ?int $navigationSort = 2;

    public static function getNavigationGroup(): ?string
    {
        return 'Contenu';
    }

    public static function canViewAny(): bool
    {
        return StaffAccess::allows('marketing.manage');
    }

    public static function canCreate(): bool
    {
        return ! FlashSaleConfig::query()->whereKey('global')->exists();
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Vente flash accueil')
                ->schema([
                    Select::make('selected_book_ids')
                        ->label('Livres sélectionnés')
                        ->multiple()
                        ->searchable()
                        ->preload()
                        ->options(fn (): array => Book::query()
                            ->where('status', 'published')
                            ->where('copyright_status', 'clear')
                            ->orderBy('title')
                            ->pluck('title', 'id')
                            ->all())
                        ->helperText('Les trois premiers livres disponibles seront affichés en priorité.'),
                    TextInput::make('discount_percentage')
                        ->label('Réduction (%)')
                        ->numeric()
                        ->minValue(1)
                        ->maxValue(90)
                        ->default(20)
                        ->required(),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('scope')->label('Portée'),
                TextColumn::make('discount_percentage')->label('Réduction')->suffix('%'),
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
            'index' => ListFlashSaleConfigs::route('/'),
            'create' => CreateFlashSaleConfig::route('/create'),
            'edit' => EditFlashSaleConfig::route('/{record}/edit'),
        ];
    }
}
