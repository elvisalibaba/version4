<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Services\MarketPricingService;
use App\Services\PromotionPricingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookPricingController extends Controller
{
    public function show(
        Request $request,
        Book $book,
        MarketPricingService $marketPricing,
        PromotionPricingService $promotions,
    ): JsonResponse {
        abort_unless($book->status === 'published' && $book->copyright_status === 'clear', 404);

        $data = $request->validate([
            'country_code' => ['nullable', 'string', 'size:2'],
            'currency_code' => ['nullable', 'string', 'size:3'],
        ]);

        $currency = mb_strtoupper((string) ($data['currency_code'] ?? $book->currency_code ?? 'USD'));
        $country = isset($data['country_code']) ? mb_strtoupper($data['country_code']) : null;

        $market = $marketPricing->resolve($book, (float) $book->price, $currency, $country);

        if ($market['market_price'] === null && mb_strtoupper((string) $book->currency_code) !== $currency) {
            return response()->json([
                'message' => 'Aucun prix actif n’est disponible pour ce marché et cette devise.',
            ], 422);
        }

        $pricing = $promotions->bestFor($book, $market['price'], $currency);

        return response()->json([
            'data' => [
                'book_id' => $book->id,
                'country_code' => $country,
                'currency_code' => $currency,
                'catalog_price' => (float) $book->price,
                'market_price' => $market['market_price'] ? (float) $market['market_price']->list_price : null,
                'original_price' => $pricing['original_price'],
                'final_price' => $pricing['price'],
                'promotion' => $pricing['promotion'] ? [
                    'id' => $pricing['promotion']->id,
                    'name' => $pricing['promotion']->name,
                    'headline' => $pricing['promotion']->headline,
                    'discount_type' => $pricing['promotion']->discount_type,
                    'discount_value' => (float) $pricing['promotion']->discount_value,
                ] : null,
            ],
        ]);
    }
}
