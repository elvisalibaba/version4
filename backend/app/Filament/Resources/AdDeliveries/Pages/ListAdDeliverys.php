<?php

namespace App\\Filament\\Resources\\AdDeliveries\\Pages;

use App\\Filament\\Resources\\AdDeliveries\\AdDeliveryResource;
use Filament\\Actions\\CreateAction;
use Filament\\Resources\\Pages\\ListRecords;

class ListAdDeliverys extends ListRecords
{
    protected static string $resource = AdDeliveryResource::class;

    protected function getHeaderActions(): array
    {
        return [CreateAction::make()];
    }
}
