<?php

namespace App\Filament\Author\Resources\PayoutAccounts\Pages;

use App\Filament\Author\Resources\PayoutAccounts\AuthorPayoutAccountResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListAuthorPayoutAccounts extends ListRecords
{
    protected static string $resource = AuthorPayoutAccountResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make()->label('Ajouter un compte'),
        ];
    }
}
