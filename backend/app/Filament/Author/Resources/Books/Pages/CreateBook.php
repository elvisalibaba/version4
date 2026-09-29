<?php

namespace App\Filament\Author\Resources\Books\Pages;

use App\Filament\Author\Resources\Books\BookResource;
use Filament\Resources\Pages\CreateRecord;

class CreateBook extends CreateRecord
{
    protected static string $resource = BookResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $author = auth()->user()?->profile?->authorProfile;

        $data['author_id'] = auth()->id();
        $data['author_display_name'] = $author?->display_name ?? auth()->user()?->name;
        $data['status'] = 'draft';
        $data['review_status'] = 'draft';
        $data['copyright_status'] = 'review';
        $data['co_authors'] = $data['co_authors'] ?? [];
        $data['categories'] = $data['categories'] ?? [];
        $data['tags'] = $data['tags'] ?? [];

        return $data;
    }
}
