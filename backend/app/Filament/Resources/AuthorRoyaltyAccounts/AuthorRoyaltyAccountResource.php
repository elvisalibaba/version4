<?php

namespace App\Filament\Resources\AuthorRoyaltyAccounts;

use App\Filament\Resources\AuthorRoyaltyAccounts\Pages\ListAuthorRoyaltyAccounts;
use App\Models\AuthorRoyaltyAccount;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class AuthorRoyaltyAccountResource extends Resource
{
    protected static ?string $model = AuthorRoyaltyAccount::class;

    protected static string | BackedEnum | null $navigationIcon = 'heroicon-o-chart-pie';

    protected static ?string $navigationLabel = 'Portefeuilles royalties';

    protected static ?string $modelLabel = 'portefeuille';

    protected static ?string $pluralModelLabel = 'portefeuilles royalties';

    protected static ?int $navigationSort = 3;

    public static function getNavigationGroup(): ?string
    {
        return 'Finance auteurs';
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
            ->columns([
                TextColumn::make('profile.email')->label('Auteur')->searchable(),
                TextColumn::make('pending_balance')->label('En attente')->money(fn (AuthorRoyaltyAccount $record): string => $record->currency_code),
                TextColumn::make('available_balance')->label('Disponible')->money(fn (AuthorRoyaltyAccount $record): string => $record->currency_code)->weight('bold'),
                TextColumn::make('lifetime_earnings')->label('Gains cumulés')->money(fn (AuthorRoyaltyAccount $record): string => $record->currency_code),
                TextColumn::make('lifetime_paid')->label('Déjà versé')->money(fn (AuthorRoyaltyAccount $record): string => $record->currency_code),
                TextColumn::make('minimum_payout')->label('Seuil')->money(fn (AuthorRoyaltyAccount $record): string => $record->currency_code),
                TextColumn::make('status')->label('Statut')->badge(),
            ])
            ->filters([
                SelectFilter::make('status')->options([
                    'active' => 'Actif',
                    'review' => 'À vérifier',
                    'suspended' => 'Suspendu',
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListAuthorRoyaltyAccounts::route('/'),
        ];
    }
}
