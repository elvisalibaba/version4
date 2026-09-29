<?php

namespace App\Filament\Author\Resources\Distribution\Pages;

use App\Filament\Author\Resources\Distribution\BookDistributionSettingResource;
use Filament\Resources\Pages\EditRecord;

class EditBookDistributionSetting extends EditRecord
{
    protected static string $resource = BookDistributionSettingResource::class;
}
