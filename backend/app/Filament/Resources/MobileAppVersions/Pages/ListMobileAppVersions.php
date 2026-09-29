<?php

namespace App\Filament\Resources\MobileAppVersions\Pages;

use App\Filament\Resources\MobileAppVersions\MobileAppVersionResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListMobileAppVersions extends ListRecords
{
    protected static string $resource = MobileAppVersionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make()->label('Nouvelle version'),
        ];
    }
}
