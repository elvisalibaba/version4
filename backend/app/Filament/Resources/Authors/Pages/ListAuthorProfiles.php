<?php

namespace App\Filament\Resources\Authors\Pages;

use App\Filament\Resources\Authors\AuthorProfileResource;
use Filament\Resources\Pages\ListRecords;

class ListAuthorProfiles extends ListRecords
{
    protected static string $resource = AuthorProfileResource::class;
}
