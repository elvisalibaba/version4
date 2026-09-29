<?php

namespace App\Filament\Resources\MobileAppConfigs\Pages;

use App\Filament\Resources\MobileAppConfigs\MobileAppConfigResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListMobileAppConfigs extends ListRecords
{
    protected static string $resource = MobileAppConfigResource::class;

    protected function getHeaderActions(): array
    {
        return MobileAppConfigResource::canCreate()
            ? [CreateAction::make()->label('Configurer l’application')]
            : [];
    }
}
