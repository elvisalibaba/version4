<?php

namespace App\Filament\Resources\AcademicTaxonomies\Pages;

use App\Filament\Resources\AcademicTaxonomies\AcademicTaxonomyResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditAcademicTaxonomy extends EditRecord
{
    protected static string $resource = AcademicTaxonomyResource::class;

    protected function getHeaderActions(): array
    {
        return [DeleteAction::make()];
    }
}
