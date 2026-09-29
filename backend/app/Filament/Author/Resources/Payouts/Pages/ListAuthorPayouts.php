<?php

namespace App\Filament\Author\Resources\Payouts\Pages;

use App\Filament\Author\Resources\Payouts\AuthorPayoutResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListAuthorPayouts extends ListRecords
{
    protected static string $resource = AuthorPayoutResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make()->label('Demander un versement'),
        ];
    }
}
