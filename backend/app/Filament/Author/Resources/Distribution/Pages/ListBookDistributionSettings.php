<?php

namespace App\Filament\Author\Resources\Distribution\Pages;

use App\Filament\Author\Resources\Distribution\BookDistributionSettingResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListBookDistributionSettings extends ListRecords
{
    protected static string $resource = BookDistributionSettingResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make()->label('Configurer un livre'),
        ];
    }
}
