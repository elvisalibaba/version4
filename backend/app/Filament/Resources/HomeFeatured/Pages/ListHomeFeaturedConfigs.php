<?php

namespace App\Filament\Resources\HomeFeatured\Pages;

use App\Filament\Resources\HomeFeatured\HomeFeaturedConfigResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListHomeFeaturedConfigs extends ListRecords
{
    protected static string $resource = HomeFeaturedConfigResource::class;

    protected function getHeaderActions(): array
    {
        return HomeFeaturedConfigResource::canCreate()
            ? [CreateAction::make()->label('Configurer la sélection')]
            : [];
    }
}
