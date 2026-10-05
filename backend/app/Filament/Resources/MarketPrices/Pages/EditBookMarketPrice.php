<?php
namespace App\Filament\Resources\MarketPrices\Pages;
use App\Filament\Resources\MarketPrices\BookMarketPriceResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;
class EditBookMarketPrice extends EditRecord {
    protected static string $resource = BookMarketPriceResource::class;
    protected function getHeaderActions(): array { return [DeleteAction::make()]; }
}
