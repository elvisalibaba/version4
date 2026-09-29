<?php

namespace App\Filament\Author\Widgets;

use App\Models\AuthorRoyaltyAccount;
use App\Models\AuthorRoyaltyTransaction;
use App\Models\Book;
use App\Models\OrderItem;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class AuthorStudioStatsOverview extends BaseWidget
{
    protected function getStats(): array
    {
        $userId = auth()->id();

        $books = Book::query()->where('author_id', $userId);
        $unitsSold = (int) OrderItem::query()
            ->whereHas('book', fn ($query) => $query->where('author_id', $userId))
            ->whereHas('order', fn ($query) => $query->where('payment_status', 'paid'))
            ->sum('quantity');

        $royalties = (float) AuthorRoyaltyTransaction::query()
            ->where('user_id', $userId)
            ->whereIn('status', ['pending', 'payable', 'paid'])
            ->sum('net_royalty');

        $wallet = AuthorRoyaltyAccount::query()->find($userId);

        return [
            Stat::make('Mes livres', (clone $books)->count())
                ->description((clone $books)->where('status', 'published')->count().' publié(s)')
                ->descriptionIcon('heroicon-m-book-open')
                ->color('primary'),

            Stat::make('Exemplaires vendus', $unitsSold)
                ->description('Commandes payées')
                ->descriptionIcon('heroicon-m-shopping-bag')
                ->color('success'),

            Stat::make('Royalties cumulées', number_format($royalties, 2, ',', ' ').' '.($wallet?->currency_code ?? 'USD'))
                ->description('Estimation enregistrée dans le ledger')
                ->descriptionIcon('heroicon-m-chart-bar-square')
                ->color('info'),

            Stat::make('Disponible', number_format((float) ($wallet?->available_balance ?? 0), 2, ',', ' ').' '.($wallet?->currency_code ?? 'USD'))
                ->description('Solde éligible au versement')
                ->descriptionIcon('heroicon-m-banknotes')
                ->color('warning'),
        ];
    }
}
