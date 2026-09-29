<?php

namespace App\Filament\Author\Resources\Royalties;

use App\Filament\Author\Resources\Royalties\Pages\ListAuthorRoyaltyTransactions;
use App\Models\AuthorRoyaltyTransaction;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class AuthorRoyaltyTransactionResource extends Resource
{
    protected static ?string $model = AuthorRoyaltyTransaction::class;

    protected static string | BackedEnum | null $navigationIcon = 'heroicon-o-chart-bar-square';

    protected static ?string $navigationLabel = 'Royalties';

    protected static ?string $modelLabel = 'royalty';

    protected static ?string $pluralModelLabel = 'royalties';

    protected static ?int $navigationSort = 1;

    public static function getNavigationGroup(): ?string
    {
        return 'Revenus';
    }

    public static function canCreate(): bool
    {
        return false;
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->where('user_id', auth()->id());
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('earned_at', 'desc')
            ->columns([
                TextColumn::make('book.title')->label('Livre')->searchable()->limit(45),
                TextColumn::make('source')->label('Source')->badge(),
                TextColumn::make('gross_amount')->label('Brut')->money(fn ($record) => $record->currency_code),
                TextColumn::make('printing_cost')->label('Impression')->money(fn ($record) => $record->currency_code)->toggleable(),
                TextColumn::make('royalty_rate')->label('Taux')->formatStateUsing(fn ($state) => number_format((float) $state * 100, 0).'%'),
                TextColumn::make('net_royalty')->label('Net auteur')->money(fn ($record) => $record->currency_code)->weight('bold'),
                TextColumn::make('status')->label('Statut')->badge(),
                TextColumn::make('payable_at')->label('Disponible le')->date('d/m/Y')->sortable(),
            ])
            ->filters([
                SelectFilter::make('status')->options([
                    'pending' => 'En attente',
                    'payable' => 'Disponible',
                    'paid' => 'Payée',
                    'reversed' => 'Annulée',
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListAuthorRoyaltyTransactions::route('/'),
        ];
    }
}
