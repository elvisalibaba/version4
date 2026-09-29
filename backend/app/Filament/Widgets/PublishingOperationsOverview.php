<?php

namespace App\Filament\Widgets;

use App\Models\AuthorPayout;
use App\Models\Book;
use App\Models\PaymentAttempt;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class PublishingOperationsOverview extends BaseWidget
{
    protected function getStats(): array
    {
        return [
            Stat::make('À valider', Book::query()->where('review_status', 'submitted')->count())
                ->description('Livres soumis par les auteurs')
                ->descriptionIcon('heroicon-m-document-check')
                ->color('warning'),

            Stat::make('Droits à vérifier', Book::query()->where('copyright_status', 'review')->count())
                ->description('Contrôle copyright / droits')
                ->descriptionIcon('heroicon-m-shield-check')
                ->color('info'),

            Stat::make('Versements demandés', AuthorPayout::query()->where('status', 'requested')->count())
                ->description('Demandes auteurs à traiter')
                ->descriptionIcon('heroicon-m-banknotes')
                ->color('success'),

            Stat::make('Paiements à surveiller', PaymentAttempt::query()->whereIn('status', ['pending', 'processing', 'failed'])->count())
                ->description('Transactions non finalisées')
                ->descriptionIcon('heroicon-m-exclamation-triangle')
                ->color('danger'),
        ];
    }
}
