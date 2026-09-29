<?php

namespace App\Filament\Resources\AdPlacements\Pages;

use App\Filament\Resources\AdPlacements\AdPlacementResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListAdPlacements extends ListRecords
{
    protected static string $resource = AdPlacementResource::class;

    protected function getHeaderActions(): array
    {
        return [CreateAction::make()];
    }
}
