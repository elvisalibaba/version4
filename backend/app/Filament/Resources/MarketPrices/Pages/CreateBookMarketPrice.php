<?php
namespace App\Filament\Resources\MarketPrices\Pages;
use App\Filament\Resources\MarketPrices\BookMarketPriceResource;
use Filament\Resources\Pages\CreateRecord;
class CreateBookMarketPrice extends CreateRecord {
    protected static string $resource = BookMarketPriceResource::class;
}
