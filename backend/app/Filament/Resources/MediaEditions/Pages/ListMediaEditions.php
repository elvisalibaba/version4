<?php

namespace App\\Filament\\Resources\\MediaEditions\\Pages;

use App\\Filament\\Resources\\MediaEditions\\MediaEditionResource;
use Filament\\Actions\\CreateAction;
use Filament\\Resources\\Pages\\ListRecords;

class ListMediaEditions extends ListRecords
{
    protected static string $resource = MediaEditionResource::class;

    protected function getHeaderActions(): array
    {
        return [CreateAction::make()];
    }
}
