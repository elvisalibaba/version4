<?php

namespace App\Filament\Resources\BookDistributionSettings\Pages;

use App\Filament\Resources\BookDistributionSettings\BookDistributionSettingResource;
use Filament\Resources\Pages\ListRecords;

class ListBookDistributionSettings extends ListRecords
{
    protected static string $resource = BookDistributionSettingResource::class;
}
