<?php

namespace App\Filament\Widgets;

use App\Models\AuthorPayout;
use App\Models\Book;
use App\Models\Order;
use App\Models\Profile;
use App\Models\PromotionCampaign;
use App\Models\PublishingReviewCase;
use App\Models\RightsContract;
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

            Stat::make('Droits à vérifier', Book::query()->where('copyright_status', 'review')->count())
                ->description('Titres non publiables tant que les droits ne sont pas validés')
                ->descriptionIcon('heroicon-m-shield-exclamation')
                ->color('warning'),

            Stat::make('Validation éditoriale', Book::query()->where('review_status', 'submitted')->count())
                ->description(Book::query()->where('bat_status', 'pending')->count().' BAT en attente')
                ->descriptionIcon('heroicon-m-document-check')
                ->color('warning'),

            Stat::make('Promotions actives', PromotionCampaign::query()
                ->where('is_active', true)
                ->where(fn ($query) => $query->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
                ->where(fn ($query) => $query->whereNull('ends_at')->orWhere('ends_at', '>=', now()))
                ->count())
                ->description('Campagnes actuellement applicables au catalogue')
                ->descriptionIcon('heroicon-m-megaphone')
                ->color('primary'),

            Stat::make('Droits à échéance', RightsContract::query()
                ->where('status', 'active')
                ->whereNotNull('ends_at')
                ->whereBetween('ends_at', [now()->toDateString(), now()->addDays(30)->toDateString()])
                ->count())
                ->description('Contrats arrivant à échéance dans les 30 jours')
                ->descriptionIcon('heroicon-m-calendar-days')
                ->color('warning'),

            Stat::make('Recours auteurs', PublishingReviewCase::query()
                ->whereIn('status', ['appealed', 'under_review'])
                ->count())
                ->description('Décisions nécessitant une revue humaine')
                ->descriptionIcon('heroicon-m-chat-bubble-left-right')
                ->color('warning'),

            Stat::make('Versements à traiter', AuthorPayout::query()
                ->whereIn('status', ['requested', 'approved', 'processing', 'failed'])
                ->count())
                ->description(AuthorPayout::query()->where('status', 'failed')->count().' en échec')
                ->descriptionIcon('heroicon-m-banknotes')
                ->color('warning'),
        ];
    }
}
