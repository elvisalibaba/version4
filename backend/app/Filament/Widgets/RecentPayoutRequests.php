<?php

namespace App\Filament\Widgets;

use App\Models\AuthorPayout;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;
use Illuminate\Database\Eloquent\Builder;

class RecentPayoutRequests extends BaseWidget
{
    protected static ?string $heading = 'Versements auteurs récents';

    protected int | string | array $columnSpan = 'full';

    public function table(Table $table): Table
    {
        return $table
            ->query(fn (): Builder => AuthorPayout::query()
                ->with(['profile', 'payoutAccount'])
                ->latest('requested_at'))
            ->columns([
                TextColumn::make('profile.email')->label('Auteur')->searchable(),
                TextColumn::make('amount')->label('Montant')->money(fn (AuthorPayout $record): string => $record->currency_code)->weight('bold'),
                TextColumn::make('payoutAccount.provider')->label('Canal')->placeholder('—'),
                TextColumn::make('status')->label('Statut')->badge(),
                TextColumn::make('requested_at')->label('Demandé')->since(),
            ])
            ->paginated([5, 10]);
    }
}
