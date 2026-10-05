<?php
namespace App\Filament\Resources\Promotions\Pages;
use App\Filament\Resources\Promotions\PromotionCampaignResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;
class ListPromotionCampaigns extends ListRecords {
    protected static string $resource = PromotionCampaignResource::class;
    protected function getHeaderActions(): array { return [CreateAction::make()]; }
}
