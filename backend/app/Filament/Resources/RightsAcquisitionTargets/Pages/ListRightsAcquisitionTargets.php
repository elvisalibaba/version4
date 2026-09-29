<?php

namespace App\Filament\Resources\RightsAcquisitionTargets\Pages;

use App\Filament\Resources\RightsAcquisitionTargets\RightsAcquisitionTargetResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListRightsAcquisitionTargets extends ListRecords
{
    protected static string $resource = RightsAcquisitionTargetResource::class;
    protected function getHeaderActions(): array { return [CreateAction::make()]; }
}
