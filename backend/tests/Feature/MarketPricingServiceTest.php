<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\BookMarketPrice;
use App\Models\PromotionCampaign;
use App\Services\MarketPricingService;
use App\Services\PromotionPricingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MarketPricingServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_market_price_overrides_catalog_currency_and_then_applies_promotion(): void
    {
        $book = Book::factory()->create([
            'price' => 10,
            'currency_code' => 'USD',
            'status' => 'published',
            'copyright_status' => 'clear',
        ]);

        BookMarketPrice::query()->create([
            'book_id' => $book->id,
            'country_code' => 'CD',
            'currency_code' => 'CDF',
            'list_price' => 28000,
            'is_active' => true,
        ]);

        PromotionCampaign::query()->create([
            'name' => 'Promo RDC',
            'internal_code' => 'PROMO-CD-TEST',
            'discount_type' => 'percentage',
            'discount_value' => 10,
            'selected_book_ids' => [$book->id],
            'channels' => ['web'],
            'is_active' => true,
            'priority' => 10,
        ]);

        $market = app(MarketPricingService::class)->resolve($book, 10, 'CDF', 'CD');
        $pricing = app(PromotionPricingService::class)->bestFor($book, $market['price'], 'CDF');

        $this->assertSame(28000.0, $market['price']);
        $this->assertSame(25200.0, $pricing['price']);

        $this->getJson("/api/v1/books/{$book->id}/pricing?country_code=CD&currency_code=CDF")
            ->assertOk()
            ->assertJsonPath('data.market_price', 28000)
            ->assertJsonPath('data.final_price', 25200);
    }
}
