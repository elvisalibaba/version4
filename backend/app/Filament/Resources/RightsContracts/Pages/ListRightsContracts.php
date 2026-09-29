<?php

namespace App\\Filament\\Resources\\RightsContracts\\Pages;

use App\\Filament\\Resources\\RightsContracts\\RightsContractResource;
use Filament\\Actions\\CreateAction;
use Filament\\Resources\\Pages\\ListRecords;

class ListRightsContracts extends ListRecords
{
    protected static string $resource = RightsContractResource::class;

    protected function getHeaderActions(): array
    {
        return [CreateAction::make()];
    }
}
