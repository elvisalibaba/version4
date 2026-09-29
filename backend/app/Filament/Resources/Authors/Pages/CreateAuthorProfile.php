<?php

namespace App\Filament\Resources\Authors\Pages;

use App\Filament\Resources\Authors\AuthorProfileResource;
use Filament\Resources\Pages\CreateRecord;

class CreateAuthorProfile extends CreateRecord
{
    protected static string $resource = AuthorProfileResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $data['genres'] ??= [];
        $data['social_links'] ??= [];
        $data['press_mentions'] ??= [];

        return $data;
    }
}
