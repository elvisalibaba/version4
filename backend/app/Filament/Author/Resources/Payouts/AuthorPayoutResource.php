<?php

namespace App\Filament\Author\Resources\Payouts;

use App\Filament\Author\Resources\Payouts\Pages\CreateAuthorPayout;
use App\Filament\Author\Resources\Payouts\Pages\ListAuthorPayouts;
use App\Models\AuthorPayout;
use App\Models\AuthorPayoutAccount;
use BackedEnum;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class AuthorPayoutResource extends Resource
{
    protected static ?string $model = AuthorPayout::class;

    protected static string | BackedEnum | null $navigationIcon = 'heroicon-o-banknotes';

    protected static ?string $navigationLabel = 'Versements';

    protected static ?string $modelLabel = 'versement';

    protected static ?string $pluralModelLabel = 'versements';

    protected static ?int $navigationSort = 3;

    public static function getNavigationGroup(): ?string
    {
        return 'Revenus';
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->where('user_id', auth()->id());
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Demande de versement')
                ->columns(2)
                ->schema([
                    Select::make('payout_account_id')
                        ->label('Compte de versement')
                        ->options(fn (): array => AuthorPayoutAccount::query()
                            ->where('user_id', auth()->id())
                            ->where('is_verified', true)
                            ->orderByDesc('is_default')
                            ->get()
                            ->mapWithKeys(fn (AuthorPayoutAccount $account) => [
                                $account->id => trim(($account->provider ?: $account->method).' · '.$account->account_name.' · '.$account->currency_code),
                            ])
                            ->all())
                        ->required()
                        ->helperText('Seuls les comptes vérifiés sont disponibles.'),
                    TextInput::make('amount')
                        ->label('Montant')
                        ->numeric()
                        ->minValue(0.01)
                        ->required(),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('requested_at', 'desc')
            ->columns([
                TextColumn::make('amount')->label('Montant')->money(fn (AuthorPayout $record): string => $record->currency_code)->weight('bold'),
                TextColumn::make('payoutAccount.provider')->label('Canal')->placeholder('—'),
                TextColumn::make('status')->label('Statut')->badge(),
                TextColumn::make('provider_reference')->label('Référence')->placeholder('—')->copyable(),
                TextColumn::make('requested_at')->label('Demandé le')->dateTime('d/m/Y H:i'),
                TextColumn::make('processed_at')->label('Traité le')->dateTime('d/m/Y H:i')->placeholder('—'),
            ])
            ->filters([
                SelectFilter::make('status')->options([
                    'requested' => 'Demandé',
                    'approved' => 'Approuvé',
                    'processing' => 'En traitement',
                    'paid' => 'Payé',
                    'failed' => 'Échec',
                    'rejected' => 'Rejeté',
                    'cancelled' => 'Annulé',
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListAuthorPayouts::route('/'),
            'create' => CreateAuthorPayout::route('/create'),
        ];
    }
}
