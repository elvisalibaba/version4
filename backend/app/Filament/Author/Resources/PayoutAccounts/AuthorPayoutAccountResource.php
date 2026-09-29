<?php

namespace App\Filament\Author\Resources\PayoutAccounts;

use App\Filament\Author\Resources\PayoutAccounts\Pages\CreateAuthorPayoutAccount;
use App\Filament\Author\Resources\PayoutAccounts\Pages\EditAuthorPayoutAccount;
use App\Filament\Author\Resources\PayoutAccounts\Pages\ListAuthorPayoutAccounts;
use App\Models\AuthorPayoutAccount;
use BackedEnum;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class AuthorPayoutAccountResource extends Resource
{
    protected static ?string $model = AuthorPayoutAccount::class;

    protected static string | BackedEnum | null $navigationIcon = 'heroicon-o-credit-card';

    protected static ?string $navigationLabel = 'Comptes de versement';

    protected static ?string $modelLabel = 'compte de versement';

    protected static ?string $pluralModelLabel = 'comptes de versement';

    protected static ?int $navigationSort = 2;

    public static function getNavigationGroup(): ?string
    {
        return 'Revenus';
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->where('user_id', auth()->id());
    }

    private static function currencyOptions(): array
    {
        $currencies = collect(config('publishing.markets', []))
            ->pluck('currency')
            ->push('USD')
            ->unique()
            ->sort()
            ->values();

        return $currencies->mapWithKeys(fn (string $currency) => [$currency => $currency])->all();
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Coordonnées de versement')
                ->columns(2)
                ->schema([
                    Select::make('method')
                        ->label('Méthode')
                        ->options(config('publishing.payout_providers', []))
                        ->required(),
                    TextInput::make('provider')
                        ->label('Banque / réseau')
                        ->placeholder('Airtel Money, M-Pesa, Orange Money, Equity Bank…')
                        ->maxLength(120),
                    Select::make('country_code')
                        ->label('Pays')
                        ->options(collect(config('publishing.markets', []))->mapWithKeys(
                            fn (array $market, string $code) => [$code => $market['name']]
                        )->all())
                        ->searchable()
                        ->required(),
                    Select::make('currency_code')
                        ->label('Devise')
                        ->options(self::currencyOptions())
                        ->default('USD')
                        ->required(),
                    TextInput::make('account_name')
                        ->label('Titulaire du compte')
                        ->required()
                        ->maxLength(255),
                    TextInput::make('account_identifier')
                        ->label('Numéro / identifiant')
                        ->password()
                        ->revealable()
                        ->required()
                        ->helperText('Chiffré dans la base de données.'),
                    Toggle::make('is_default')->label('Compte par défaut'),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('method')->label('Méthode')->badge(),
                TextColumn::make('provider')->label('Banque / réseau')->placeholder('—'),
                TextColumn::make('country_code')->label('Pays')->badge(),
                TextColumn::make('currency_code')->label('Devise'),
                TextColumn::make('account_name')->label('Titulaire')->searchable(),
                TextColumn::make('account_identifier')
                    ->label('Compte')
                    ->formatStateUsing(fn ($state) => $state ? '•••• '.substr((string) $state, -4) : '—'),
                IconColumn::make('is_verified')->label('Vérifié')->boolean(),
                IconColumn::make('is_default')->label('Défaut')->boolean(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListAuthorPayoutAccounts::route('/'),
            'create' => CreateAuthorPayoutAccount::route('/create'),
            'edit' => EditAuthorPayoutAccount::route('/{record}/edit'),
        ];
    }
}
