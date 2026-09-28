<?php

namespace App\Filament\Resources\Authors\Pages;

use App\Filament\Resources\Authors\AuthorProfileResource;
use Filament\Resources\Pages\EditRecord;

class EditAuthorProfile extends EditRecord
{
    protected static string $resource = AuthorProfileResource::class;
}
