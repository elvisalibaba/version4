<?php
namespace App\Filament\Resources\Promotions\Pages;
use App\Filament\Resources\Promotions\PromotionCampaignResource;
use Filament\Resources\Pages\CreateRecord;
class CreatePromotionCampaign extends CreateRecord {
    protected static string $resource = PromotionCampaignResource::class;
    protected function mutateFormDataBeforeCreate(array $data): array {
        $data['created_by'] = auth()->user()?->profile?->id;
        return $data;
    }
}
