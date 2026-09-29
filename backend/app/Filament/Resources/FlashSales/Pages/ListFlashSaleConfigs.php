<?php

namespace App\Filament\Resources\FlashSales\Pages;

use App\Filament\Resources\FlashSales\FlashSaleConfigResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListFlashSaleConfigs extends ListRecords
{
    protected static string $resource = FlashSaleConfigResource::class;

    protected function getHeaderActions(): array
    {
        return FlashSaleConfigResource::canCreate()
            ? [CreateAction::make()->label('Configurer la vente flash')]
            : [];
    }
}
