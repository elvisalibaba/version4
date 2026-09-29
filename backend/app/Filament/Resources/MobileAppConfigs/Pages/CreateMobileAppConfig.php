<?php

namespace App\Filament\Resources\MobileAppConfigs\Pages;

use App\Filament\Resources\MobileAppConfigs\MobileAppConfigResource;
use Filament\Resources\Pages\CreateRecord;

class CreateMobileAppConfig extends CreateRecord
{
    protected static string $resource = MobileAppConfigResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $data['scope'] = 'global';

        return $data;
    }
}
