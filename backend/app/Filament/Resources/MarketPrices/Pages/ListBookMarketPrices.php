<?php
namespace App\Filament\Resources\MarketPrices\Pages;
use App\Filament\Resources\MarketPrices\BookMarketPriceResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;
class ListBookMarketPrices extends ListRecords {
    protected static string $resource = BookMarketPriceResource::class;
    protected function getHeaderActions(): array { return [CreateAction::make()]; }
}
