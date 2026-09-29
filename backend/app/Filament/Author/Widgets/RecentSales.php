<?php

namespace App\Filament\Author\Widgets;

use App\Models\OrderItem;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;
use Illuminate\Database\Eloquent\Builder;

class RecentSales extends BaseWidget
{
    protected static ?string $heading = 'Ventes récentes';

    protected int | string | array $columnSpan = 'full';

    public function table(Table $table): Table
    {
        return $table
            ->query(fn (): Builder => OrderItem::query()
                ->whereHas('book', fn (Builder $query) => $query->where('author_id', auth()->id()))
                ->whereHas('order', fn (Builder $query) => $query->where('payment_status', 'paid'))
                ->with(['book', 'order'])
                ->orderByDesc('id'))
            ->columns([
                TextColumn::make('book.title')->label('Livre')->limit(45),
                TextColumn::make('book_format')->label('Format')->badge(),
                TextColumn::make('quantity')->label('Qté')->numeric(),
                TextColumn::make('price')->label('Prix unitaire')->money(fn (OrderItem $record): string => $record->currency_code),
                TextColumn::make('order.created_at')->label('Date')->dateTime('d/m/Y H:i'),
            ])
            ->paginated([5, 10]);
    }
}
