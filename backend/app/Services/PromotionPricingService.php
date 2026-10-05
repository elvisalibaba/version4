<?php

namespace App\Services;

use App\Models\Book;
use App\Models\PromotionCampaign;

class PromotionPricingService
{
    public function bestFor(Book $book, float $basePrice, string $currencyCode): array
    {
        $campaigns = PromotionCampaign::query()
            ->where('is_active', true)
            ->where(fn ($query) => $query->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
            ->where(fn ($query) => $query->whereNull('ends_at')->orWhere('ends_at', '>=', now()))
            ->orderBy('priority')
            ->orderByDesc('discount_value')
            ->get();

        $best = null;
        $bestPrice = $basePrice;

        foreach ($campaigns as $campaign) {
            $bookIds = $campaign->selected_book_ids ?? [];

            if ($bookIds !== [] && ! in_array($book->id, $bookIds, true)) {
                continue;
            }

            if ($campaign->discount_type === 'fixed' && filled($campaign->currency_code)
                && mb_strtoupper((string) $campaign->currency_code) !== mb_strtoupper($currencyCode)) {
                continue;
            }

            $candidate = $campaign->discount_type === 'percentage'
                ? $basePrice * (1 - min(100, max(0, (float) $campaign->discount_value)) / 100)
                : $basePrice - max(0, (float) $campaign->discount_value);

            $candidate = round(max(0, $candidate), 2);

            if ($candidate < $bestPrice) {
                $bestPrice = $candidate;
                $best = $campaign;
            }
        }

        return [
            'original_price' => round($basePrice, 2),
            'price' => $bestPrice,
            'promotion' => $best,
        ];
    }
}
