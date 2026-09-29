<?php

namespace App\Filament\Resources\MediaChapters\Pages;

use App\Filament\Resources\MediaChapters\MediaChapterResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListMediaChapters extends ListRecords
{
    protected static string $resource = MediaChapterResource::class;
    protected function getHeaderActions(): array { return [CreateAction::make()]; }
}
