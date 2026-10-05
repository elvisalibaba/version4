<?php

namespace App\Filament\Resources\AuthorPayoutAccounts;

use App\Support\StaffAccess;
use App\Filament\Resources\AuthorPayoutAccounts\Pages\ListAuthorPayoutAccounts;
use App\Models\AuthorPayoutAccount;
use BackedEnum;
use Filament\Actions\Action;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;

class AuthorPayoutAccountResource extends Resource
{
    protected static ?string $model = AuthorPayoutAccount::class;

    protected static string | BackedEnum | null $navigationIcon = 'heroicon-o-identification';

    protected static ?string $navigationLabel = 'Comptes auteurs';

    protected static ?string $modelLabel = 'compte auteur';

    protected static ?string $pluralModelLabel = 'comptes auteurs';

    protected static ?int $navigationSort = 1;

    public static function getNavigationGroup(): ?string
    {
        return 'Finance auteurs';
    }

    public static function canViewAny(): bool
    {
        return StaffAccess::allows('finance.manage');
    }

    public static function canCreate(): bool
    {
        return false;
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                TextColumn::make('profile.email')->label('Auteur')->searchable(),
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
            ])
            ->filters([
                TernaryFilter::make('is_verified')->label('Vérifié'),
            ])
            ->recordActions([
                Action::make('verify')
                    ->label('Vérifier')
                    ->icon('heroicon-o-check-badge')
                    ->color('success')
                    ->requiresConfirmation()
                    ->visible(fn (AuthorPayoutAccount $record): bool => ! $record->is_verified)
                    ->action(fn (AuthorPayoutAccount $record) => $record->update([
                        'is_verified' => true,
                        'verified_at' => now(),
                    ])),
                Action::make('unverify')
                    ->label('Retirer validation')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->visible(fn (AuthorPayoutAccount $record): bool => $record->is_verified)
                    ->action(fn (AuthorPayoutAccount $record) => $record->update([
                        'is_verified' => false,
                        'verified_at' => null,
                    ])),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListAuthorPayoutAccounts::route('/'),
        ];
    }
}
