<?php

namespace App\Filament\Resources\Books\Pages;

use App\Filament\Resources\Books\BookResource;
use App\Services\BookDocumentMetadataService;
use Filament\Resources\Pages\CreateRecord;

class CreateBook extends CreateRecord
{
    protected static string $resource = BookResource::class;

    protected function afterCreate(): void
    {
        app(BookDocumentMetadataService::class)->enrich($this->record);
    }
}
