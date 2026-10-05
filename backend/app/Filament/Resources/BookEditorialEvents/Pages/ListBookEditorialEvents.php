<?php

namespace App\Filament\Resources\BookEditorialEvents\Pages;

use App\Filament\Resources\BookEditorialEvents\BookEditorialEventResource;
use Filament\Resources\Pages\ListRecords;

class ListBookEditorialEvents extends ListRecords
{
    protected static string $resource = BookEditorialEventResource::class;
}
