<?php

namespace App\Filament\Resources\HomeFeatured\Pages;

use App\Filament\Resources\HomeFeatured\HomeFeaturedConfigResource;
use Filament\Resources\Pages\CreateRecord;

class CreateHomeFeaturedConfig extends CreateRecord
{
    protected static string $resource = HomeFeaturedConfigResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $data['scope'] = 'global';

        return $data;
    }
}
