<?php

namespace App\Filament\Author\Widgets;

use App\Models\AuthorRoyaltyTransaction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;
use Illuminate\Database\Eloquent\Builder;

class RecentRoyalties extends BaseWidget
{
    protected static ?string $heading = 'Royalties récentes';

    protected int | string | array $columnSpan = 'full';

    public function table(Table $table): Table
    {
        return $table
            ->query(fn (): Builder => AuthorRoyaltyTransaction::query()
                ->where('user_id', auth()->id())
                ->with('book')
                ->latest('earned_at'))
            ->columns([
                TextColumn::make('book.title')->label('Livre')->limit(40),
                TextColumn::make('source')->label('Source')->badge(),
                TextColumn::make('gross_amount')->label('Vente brute')->money(fn ($record) => $record->currency_code),
                TextColumn::make('royalty_rate')->label('Taux')->formatStateUsing(fn ($state) => number_format((float) $state * 100, 0).'%'),
                TextColumn::make('net_royalty')->label('Royalty')->money(fn ($record) => $record->currency_code)->weight('bold'),
                TextColumn::make('status')->label('Statut')->badge(),
                TextColumn::make('earned_at')->label('Date')->dateTime('d/m/Y'),
            ])
            ->paginated([5, 10]);
    }
}
