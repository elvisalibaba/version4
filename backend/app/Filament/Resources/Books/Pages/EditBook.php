<?php

namespace App\Filament\Resources\Books\Pages;

use App\Filament\Resources\Books\BookResource;
use App\Models\AuthorProfile;
use App\Services\BookDocumentMetadataService;
use Filament\Resources\Pages\EditRecord;

class EditBook extends EditRecord
{
    protected static string $resource = BookResource::class;

    protected function mutateFormDataBeforeSave(array $data): array
    {
        $data['co_authors'] = is_array($data['co_authors'] ?? null) ? $data['co_authors'] : [];
        $data['categories'] = is_array($data['categories'] ?? null) ? $data['categories'] : [];
        $data['tags'] = is_array($data['tags'] ?? null) ? $data['tags'] : [];

        if (blank($data['author_display_name'] ?? null) && filled($data['author_id'] ?? null)) {
            $data['author_display_name'] = AuthorProfile::query()
                ->whereKey($data['author_id'])
                ->value('display_name');
        }

        return $data;
    }

    protected function afterSave(): void
    {
        app(BookDocumentMetadataService::class)->enrich($this->record);
    }
}
