<?php

namespace App\Filament\Author\Resources\Distribution;

use App\Filament\Author\Resources\Distribution\Pages\CreateBookDistributionSetting;
use App\Filament\Author\Resources\Distribution\Pages\EditBookDistributionSetting;
use App\Filament\Author\Resources\Distribution\Pages\ListBookDistributionSettings;
use App\Models\Book;
use App\Models\BookDistributionSetting;
use BackedEnum;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class BookDistributionSettingResource extends Resource
{
    protected static ?string $model = BookDistributionSetting::class;

    protected static string | BackedEnum | null $navigationIcon = 'heroicon-o-globe-alt';

    protected static ?string $navigationLabel = 'Distribution';

    protected static ?string $modelLabel = 'distribution';

    protected static ?string $pluralModelLabel = 'distribution';

    protected static ?int $navigationSort = 2;

    public static function getNavigationGroup(): ?string
    {
        return 'Publication';
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->whereHas('book', fn (Builder $query) => $query->where('author_id', auth()->id()));
    }

    private static function marketOptions(): array
    {
        return collect(config('publishing.markets', []))
            ->mapWithKeys(fn (array $market, string $code) => [$code => $market['name'].' · '.$market['currency']])
            ->all();
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Livre et marché principal')
                ->columns(2)
                ->schema([
                    Select::make('book_id')
                        ->label('Livre')
                        ->options(fn (): array => Book::query()
                            ->where('author_id', auth()->id())
                            ->orderBy('title')
                            ->pluck('title', 'id')
                            ->all())
                        ->searchable()
                        ->required()
                        ->unique(ignoreRecord: true),
                    Select::make('primary_market')
                        ->label('Marché principal')
                        ->options(self::marketOptions())
                        ->default('CD')
                        ->searchable()
                        ->required(),
                    Select::make('territory_mode')
                        ->label('Droits territoriaux')
                        ->options([
                            'worldwide' => 'Monde entier',
                            'selected' => 'Territoires sélectionnés',
                        ])
                        ->default('worldwide')
                        ->required(),
                    Select::make('territories')
                        ->label('Territoires ciblés')
                        ->options(self::marketOptions())
                        ->multiple()
                        ->searchable()
                        ->preload(),
                    TextInput::make('local_currency')
                        ->label('Devise de référence')
                        ->default('USD')
                        ->maxLength(3)
                        ->required(),
                    TextInput::make('royalty_rate')
                        ->label('Taux auteur')
                        ->numeric()
                        ->step(0.01)
                        ->minValue(0)
                        ->maxValue(1)
                        ->placeholder('0.70')
                        ->helperText('Exemple : 0,70 = 70 %. Laissez vide pour utiliser le taux plateforme.'),
                ]),

            Section::make('Canaux de distribution')
                ->schema([
                    Select::make('sales_channels')
                        ->label('Canaux')
                        ->multiple()
                        ->options([
                            'web_store' => 'HolisticBooks Web',
                            'mobile_app' => 'Application mobile',
                            'bookstore' => 'Librairies partenaires',
                            'institutional' => 'Institutions / écoles / entreprises',
                            'print_on_demand' => 'Impression à la demande',
                        ])
                        ->default(['web_store', 'mobile_app']),
                    Toggle::make('preorder_enabled')->label('Précommande'),
                    Toggle::make('print_on_demand_enabled')->label('Impression à la demande'),
                    Toggle::make('local_print_enabled')->label('Impression locale'),
                    Toggle::make('institutional_sales_enabled')->label('Ventes institutionnelles'),
                    Toggle::make('bookstore_distribution_enabled')->label('Distribution librairies'),
                    Textarea::make('distribution_notes')->label('Notes de distribution')->rows(4)->columnSpanFull(),
                ])
                ->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('book.title')->label('Livre')->searchable()->limit(45),
                TextColumn::make('primary_market')->label('Marché')->badge(),
                TextColumn::make('territory_mode')->label('Territoires')->badge(),
                TextColumn::make('royalty_rate')->label('Taux auteur')->formatStateUsing(fn ($state) => $state === null ? 'Taux plateforme' : number_format((float) $state * 100, 0).'%'),
                IconColumn::make('local_print_enabled')->label('Print local')->boolean(),
                IconColumn::make('institutional_sales_enabled')->label('B2B')->boolean(),
                TextColumn::make('updated_at')->label('Mise à jour')->since(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListBookDistributionSettings::route('/'),
            'create' => CreateBookDistributionSetting::route('/create'),
            'edit' => EditBookDistributionSetting::route('/{record}/edit'),
        ];
    }
}
