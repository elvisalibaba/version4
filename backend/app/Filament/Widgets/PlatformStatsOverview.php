<?php

namespace App\Filament\Widgets;

use App\Models\Book;
use App\Models\Order;
use App\Models\Profile;
use App\Models\Subscription;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class PlatformStatsOverview extends BaseWidget
{
    protected function getStats(): array
    {
        $paidRevenue = (float) Order::query()
            ->where('payment_status', 'paid')
            ->sum('total_price');

        return [
            Stat::make('Livres', Book::query()->count())
                ->description(Book::query()->where('status', 'published')->count().' publiés')
                ->descriptionIcon('heroicon-m-book-open')
                ->color('primary'),

            Stat::make('Utilisateurs', Profile::query()->count())
                ->description(Profile::query()->where('role', 'author')->count().' auteurs')
                ->descriptionIcon('heroicon-m-users')
                ->color('info'),

            Stat::make('Abonnements actifs', Subscription::query()->currentlyActive()->count())
                ->description('Accès numériques actuellement valides')
                ->descriptionIcon('heroicon-m-credit-card')
                ->color('success'),

            Stat::make('Revenus encaissés', number_format($paidRevenue, 2, ',', ' ').' USD')
                ->description(Order::query()->where('payment_status', 'paid')->count().' commandes payées')
                ->descriptionIcon('heroicon-m-banknotes')
                ->color('success'),
        ];
    }
}
