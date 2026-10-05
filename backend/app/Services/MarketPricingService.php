<?php

namespace App\Services;

use App\Models\Book;
use App\Models\BookMarketPrice;

class MarketPricingService
{
    public function resolve(Book $book, float $fallbackPrice, string $currencyCode, ?string $countryCode): array
    {
        $country = $countryCode ? mb_strtoupper($countryCode) : null;
        $currency = mb_strtoupper($currencyCode);

        if (! $country || mb_strlen($country) !== 2) {
            return ['price' => round($fallbackPrice, 2), 'market_price' => null];
        }

        $market = BookMarketPrice::query()
            ->where('book_id', $book->id)
            ->where('country_code', $country)
            ->where('currency_code', $currency)
            ->where('is_active', true)
            ->where(fn ($query) => $query->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
            ->where(fn ($query) => $query->whereNull('ends_at')->orWhere('ends_at', '>=', now()))
            ->first();

        return [
            'price' => $market ? (float) $market->list_price : round($fallbackPrice, 2),
            'market_price' => $market,
        ];
    }
}
