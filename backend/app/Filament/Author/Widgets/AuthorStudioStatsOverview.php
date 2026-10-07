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

        $wallet = AuthorRoyaltyAccount::primaryFor((string) $userId);
        $currency = $wallet?->currency_code ?? mb_strtoupper((string) config('publishing.default_currency', 'USD'));

        $royalties = (float) AuthorRoyaltyTransaction::query()
            ->where('user_id', $userId)
            ->where('currency_code', $currency)
            ->whereIn('status', ['pending', 'payable', 'paid'])
            ->sum('net_royalty');

        $otherWallets = AuthorRoyaltyAccount::query()
            ->where('user_id', $userId)
            ->where('currency_code', '!=', $currency)
            ->where('available_balance', '>', 0)
            ->get()
            ->map(fn (AuthorRoyaltyAccount $account): string => number_format((float) $account->available_balance, 2, ',', ' ').' '.$account->currency_code)
            ->implode(' · ');

        return [
            Stat::make('Mes livres', (clone $books)->count())
                ->description((clone $books)->where('status', 'published')->count().' publié(s)')
                ->descriptionIcon('heroicon-m-book-open')
                ->color('primary'),

            Stat::make('Exemplaires vendus', $unitsSold)
                ->description('Commandes payées')
                ->descriptionIcon('heroicon-m-shopping-bag')
                ->color('success'),

            Stat::make('Royalties cumulées', number_format($royalties, 2, ',', ' ').' '.$currency)
                ->description('Estimation enregistrée dans le ledger')
                ->descriptionIcon('heroicon-m-chart-bar-square')
                ->color('info'),

            Stat::make('Disponible', number_format((float) ($wallet?->available_balance ?? 0), 2, ',', ' ').' '.$currency)
                ->description($otherWallets !== '' ? 'Autres devises : '.$otherWallets : 'Solde éligible au versement')
                ->descriptionIcon('heroicon-m-banknotes')
                ->color('warning'),
        ];
    }
}
