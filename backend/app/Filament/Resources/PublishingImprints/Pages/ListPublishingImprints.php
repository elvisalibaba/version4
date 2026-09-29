<?php

namespace App\Filament\Resources\PublishingImprints\Pages;

use App\Filament\Resources\PublishingImprints\PublishingImprintResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListPublishingImprints extends ListRecords
{
    protected static string $resource = PublishingImprintResource::class;

    protected function getHeaderActions(): array
    {
        return [CreateAction::make()];
    }
}
