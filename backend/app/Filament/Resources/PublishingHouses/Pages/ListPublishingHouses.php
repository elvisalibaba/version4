<?php

namespace App\\Filament\\Resources\\PublishingHouses\\Pages;

use App\\Filament\\Resources\\PublishingHouses\\PublishingHouseResource;
use Filament\\Actions\\CreateAction;
use Filament\\Resources\\Pages\\ListRecords;

class ListPublishingHouses extends ListRecords
{
    protected static string $resource = PublishingHouseResource::class;

    protected function getHeaderActions(): array
    {
        return [CreateAction::make()];
    }
}
