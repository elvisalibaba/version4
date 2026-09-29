<?php

namespace App\Filament\Widgets;

use App\Models\AdCampaign;
use App\Models\AdEvent;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class AdvertisingPerformanceOverview extends BaseWidget
{
    protected function getStats(): array
    {
        $impressions = AdEvent::query()->where('event_type', 'impression')->count();
        $clicks = AdEvent::query()->where('event_type', 'click')->count();
        $ctr = $impressions > 0 ? ($clicks / $impressions) * 100 : 0;

        return [
            Stat::make('Campagnes actives', AdCampaign::query()->where('status', 'active')->count())
                ->description('Web et mobile')
                ->descriptionIcon('heroicon-m-megaphone')
                ->color('warning'),
            Stat::make('Impressions', number_format($impressions, 0, ',', ' '))
                ->description('Diffusions comptabilisées')
                ->descriptionIcon('heroicon-m-eye')
                ->color('info'),
            Stat::make('Clics publicitaires', number_format($clicks, 0, ',', ' '))
                ->description(number_format($ctr, 2, ',', ' ').'% CTR')
                ->descriptionIcon('heroicon-m-cursor-arrow-rays')
                ->color('success'),
        ];
    }
}
