<?php

namespace App\Filament\Resources\MarketPrices;

use App\Filament\Resources\MarketPrices\Pages\CreateBookMarketPrice;
use App\Filament\Resources\MarketPrices\Pages\EditBookMarketPrice;
use App\Filament\Resources\MarketPrices\Pages\ListBookMarketPrices;
use App\Models\BookMarketPrice;
use BackedEnum;
use Filament\Actions\EditAction;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
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

class BookMarketPriceResource extends Resource
{
    protected static ?string $model = BookMarketPrice::class;
    protected static string | BackedEnum | null $navigationIcon = 'heroicon-o-globe-alt';
    protected static ?string $navigationLabel = 'Prix par marché';
    protected static ?string $modelLabel = 'prix marché';
    protected static ?string $pluralModelLabel = 'prix par marché';
    protected static ?int $navigationSort = 4;

    public static function getNavigationGroup(): ?string
    {
        return 'Commerce';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Tarification locale')
                ->columns(2)
                ->schema([
                    Select::make('book_id')
                        ->label('Livre')
                        ->relationship('book', 'title')
                        ->searchable()
                        ->preload()
                        ->required(),
                    TextInput::make('country_code')
                        ->label('Pays ISO')
                        ->helperText('Code ISO alpha-2, ex. CD, CG, CI, FR.')
                        ->required()
                        ->length(2),
                    TextInput::make('currency_code')
                        ->label('Devise')
                        ->required()
                        ->length(3),
                    TextInput::make('list_price')
                        ->label('Prix local')
                        ->numeric()
                        ->minValue(0)
                        ->required(),
                    Toggle::make('is_active')->label('Actif')->default(true),
                    DateTimePicker::make('starts_at')->label('Début optionnel'),
                    DateTimePicker::make('ends_at')->label('Fin optionnelle'),
                    Textarea::make('notes')->label('Notes internes')->rows(3)->columnSpanFull(),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('updated_at', 'desc')
            ->columns([
                TextColumn::make('book.title')->label('Livre')->searchable()->limit(45),
                TextColumn::make('country_code')->label('Pays')->badge()->sortable(),
                TextColumn::make('currency_code')->label('Devise')->badge(),
                TextColumn::make('list_price')->label('Prix')->money(fn (BookMarketPrice $record): string => $record->currency_code),
                IconColumn::make('is_active')->label('Actif')->boolean(),
                TextColumn::make('starts_at')->label('Début')->dateTime('d/m/Y H:i'),
                TextColumn::make('ends_at')->label('Fin')->dateTime('d/m/Y H:i'),
            ])
            ->filters([
                SelectFilter::make('country_code')->label('Pays')->options(
                    fn (): array => BookMarketPrice::query()
                        ->select('country_code')
                        ->distinct()
                        ->orderBy('country_code')
                        ->pluck('country_code', 'country_code')
                        ->all()
                ),
            ])
            ->recordActions([EditAction::make()]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListBookMarketPrices::route('/'),
            'create' => CreateBookMarketPrice::route('/create'),
            'edit' => EditBookMarketPrice::route('/{record}/edit'),
        ];
    }
}
