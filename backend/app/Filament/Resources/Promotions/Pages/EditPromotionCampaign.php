<?php
namespace App\Filament\Resources\Promotions\Pages;
use App\Filament\Resources\Promotions\PromotionCampaignResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;
class EditPromotionCampaign extends EditRecord {
    protected static string $resource = PromotionCampaignResource::class;
    protected function getHeaderActions(): array { return [DeleteAction::make()]; }
}
