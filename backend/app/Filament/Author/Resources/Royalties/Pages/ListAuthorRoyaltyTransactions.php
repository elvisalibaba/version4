<?php

namespace App\Filament\Author\Resources\Royalties\Pages;

use App\Filament\Author\Resources\Royalties\AuthorRoyaltyTransactionResource;
use Filament\Resources\Pages\ListRecords;

class ListAuthorRoyaltyTransactions extends ListRecords
{
    protected static string $resource = AuthorRoyaltyTransactionResource::class;
}
