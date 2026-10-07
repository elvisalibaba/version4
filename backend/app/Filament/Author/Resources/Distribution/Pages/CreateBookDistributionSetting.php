<?php

namespace App\Filament\Author\Resources\Distribution\Pages;

use App\Filament\Author\Resources\Distribution\BookDistributionSettingResource;
use Filament\Resources\Pages\CreateRecord;

class CreateBookDistributionSetting extends CreateRecord
{
    protected static string $resource = BookDistributionSettingResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $data['territories'] = $data['territories'] ?? [];
        $data['sales_channels'] = $data['sales_channels'] ?? ['web_store', 'mobile_app'];

        // Le taux contractuel est fixé par l'équipe finance (Control Center).
        unset($data['royalty_rate']);

        return $data;
    }
}
