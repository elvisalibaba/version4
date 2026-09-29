<?php

namespace App\Filament\Resources\PublishingHouseMembers\Pages;

use App\Filament\Resources\PublishingHouseMembers\PublishingHouseMemberResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListPublishingHouseMembers extends ListRecords
{
    protected static string $resource = PublishingHouseMemberResource::class;
    protected function getHeaderActions(): array { return [CreateAction::make()]; }
}
