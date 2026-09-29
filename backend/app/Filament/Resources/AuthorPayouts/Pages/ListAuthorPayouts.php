<?php

namespace App\Filament\Resources\AuthorPayouts\Pages;

use App\Filament\Resources\AuthorPayouts\AuthorPayoutResource;
use Filament\Resources\Pages\ListRecords;

class ListAuthorPayouts extends ListRecords
{
    protected static string $resource = AuthorPayoutResource::class;
}
