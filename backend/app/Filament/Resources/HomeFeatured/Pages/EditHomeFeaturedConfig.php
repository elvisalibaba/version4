<?php

namespace App\Filament\Resources\HomeFeatured\Pages;

use App\Filament\Resources\HomeFeatured\HomeFeaturedConfigResource;
use Filament\Resources\Pages\EditRecord;

class EditHomeFeaturedConfig extends EditRecord
{
    protected static string $resource = HomeFeaturedConfigResource::class;
}
