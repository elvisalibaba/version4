<?php

namespace App\Filament\Resources\FlashSales\Pages;

use App\Filament\Resources\FlashSales\FlashSaleConfigResource;
use Filament\Resources\Pages\CreateRecord;

class CreateFlashSaleConfig extends CreateRecord
{
    protected static string $resource = FlashSaleConfigResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $data['scope'] = 'global';

        return $data;
    }
}
