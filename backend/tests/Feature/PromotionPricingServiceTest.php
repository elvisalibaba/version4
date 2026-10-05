<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\PromotionCampaign;
use App\Services\PromotionPricingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PromotionPricingServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_active_promotion_reduces_book_price_and_keeps_original_price(): void
    {
        $book = Book::factory()->create(['price' => 20, 'currency_code' => 'USD']);

        $campaign = PromotionCampaign::query()->create([
            'name' => 'Rentrée littéraire',
            'internal_code' => 'RENTREE-2026',
            'discount_type' => 'percentage',
            'discount_value' => 25,
            'selected_book_ids' => [$book->id],
            'channels' => ['web', 'mobile'],
            'is_active' => true,
            'priority' => 10,
            'starts_at' => now()->subHour(),
            'ends_at' => now()->addDay(),
        ]);

        $pricing = app(PromotionPricingService::class)->bestFor($book, 20, 'USD');

        $this->assertSame(20.0, $pricing['original_price']);
        $this->assertSame(15.0, $pricing['price']);
        $this->assertSame($campaign->id, $pricing['promotion']?->id);
    }

    public function test_books_are_non_downloadable_by_default(): void
    {
        $book = Book::factory()->create();

        $this->assertFalse((bool) $book->allow_download);
        $this->assertFalse($book->readerPermissions()['can_download']);
    }
}
