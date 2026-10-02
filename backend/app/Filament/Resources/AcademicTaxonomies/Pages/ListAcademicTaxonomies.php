<?php

namespace App\Filament\Resources\AcademicTaxonomies\Pages;

use App\Filament\Resources\AcademicTaxonomies\AcademicTaxonomyResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListAcademicTaxonomies extends ListRecords
{
    protected static string $resource = AcademicTaxonomyResource::class;

    protected function getHeaderActions(): array
    {
        return [CreateAction::make()];
    }
}
