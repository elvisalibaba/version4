<?php

namespace App\Filament\Widgets;

use App\Models\AdCampaign;
use App\Models\MediaEdition;
use App\Models\PublishingHouse;
use App\Models\RightsContract;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class PublishingBusinessOverview extends BaseWidget
{
    protected function getStats(): array
    {
        return [
            Stat::make('Maisons / marques', PublishingHouse::query()->where('status', 'active')->count())
                ->description('Structures éditoriales actives')
                ->descriptionIcon('heroicon-m-building-office-2')
                ->color('primary'),

            Stat::make('Droits actifs', RightsContract::query()->where('status', 'active')->count())
                ->description(RightsContract::query()->whereIn('status', ['draft', 'negotiating'])->count().' dossier(s) en préparation')
                ->descriptionIcon('heroicon-m-shield-check')
                ->color('success'),

            Stat::make('Audio & vidéo', MediaEdition::query()->whereIn('media_type', ['audiobook', 'video'])->count())
                ->description(MediaEdition::query()->where('status', 'published')->count().' média(s) publié(s)')
                ->descriptionIcon('heroicon-m-play-circle')
                ->color('info'),

            Stat::make('Campagnes publicitaires', AdCampaign::query()->where('status', 'active')->count())
                ->description(AdCampaign::query()->whereIn('status', ['draft', 'scheduled'])->count().' à préparer')
                ->descriptionIcon('heroicon-m-megaphone')
                ->color('warning'),
        ];
    }
}
