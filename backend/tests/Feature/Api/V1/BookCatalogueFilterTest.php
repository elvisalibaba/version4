<?php

namespace Tests\Feature\Api\V1;

use App\Models\Book;
use App\Models\BookFormat;
use App\Models\Category;
use App\Models\MediaEdition;
use App\Models\Rating;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class BookCatalogueFilterTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_default_sort_is_newest_first(): void
    {
        $older = Book::factory()->create(['published_at' => now()->subDays(3)]);
        $newer = Book::factory()->create(['published_at' => now()->subDay()]);

        $this->assertSame([$newer->id, $older->id], $this->catalogueIds());
    }

    public function test_bestsellers_sort_orders_by_purchases(): void
    {
        $quiet = Book::factory()->create(['purchases_count' => 2]);
        $popular = Book::factory()->create(['purchases_count' => 40]);

        $this->assertSame([$popular->id, $quiet->id], $this->catalogueIds('?sort=bestsellers'));
    }

    public function test_price_sorts_order_by_price(): void
    {
        $cheap = Book::factory()->create(['price' => 3]);
        $expensive = Book::factory()->create(['price' => 30]);

        $this->assertSame([$cheap->id, $expensive->id], $this->catalogueIds('?sort=price_asc'));
        $this->assertSame([$expensive->id, $cheap->id], $this->catalogueIds('?sort=price_desc'));
    }

    public function test_rating_sort_ignores_hidden_ratings(): void
    {
        $wellRated = Book::factory()->create();
        $boosted = Book::factory()->create();
        Rating::factory()->create(['book_id' => $wellRated->id, 'rating' => 5]);
        Rating::factory()->create(['book_id' => $boosted->id, 'rating' => 2]);
        Rating::factory()->create(['book_id' => $boosted->id, 'rating' => 5, 'is_hidden' => true]);
        Rating::factory()->create(['book_id' => $boosted->id, 'rating' => 5, 'is_hidden' => true]);

        $this->assertSame([$wellRated->id, $boosted->id], $this->catalogueIds('?sort=rating'));
    }

    public function test_format_filter_only_matches_published_formats(): void
    {
        $paperback = Book::factory()->create();
        BookFormat::factory()->create(['book_id' => $paperback->id, 'format' => 'paperback']);
        $unpublished = Book::factory()->create();
        BookFormat::factory()->create(['book_id' => $unpublished->id, 'format' => 'paperback', 'is_published' => false]);
        $ebook = Book::factory()->create();
        BookFormat::factory()->create(['book_id' => $ebook->id, 'format' => 'ebook']);

        $this->assertSame([$paperback->id], $this->catalogueIds('?format=paperback'));
        $this->assertEqualsCanonicalizing(
            [$paperback->id, $ebook->id],
            $this->catalogueIds('?format=paperback,ebook'),
        );
        $this->assertEqualsCanonicalizing(
            [$paperback->id, $ebook->id],
            $this->catalogueIds('?format[]=paperback&format[]=ebook'),
        );
    }

    public function test_audiobook_format_includes_published_media_editions(): void
    {
        $audio = Book::factory()->create();
        MediaEdition::query()->create(['book_id' => $audio->id, 'media_type' => 'audiobook', 'status' => 'published']);
        $draftAudio = Book::factory()->create();
        MediaEdition::query()->create(['book_id' => $draftAudio->id, 'media_type' => 'audiobook', 'status' => 'draft']);

        $this->assertSame([$audio->id], $this->catalogueIds('?format=audiobook'));
    }

    public function test_unknown_format_is_rejected(): void
    {
        $this->getJson('/api/v1/books?format=vinyl')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('format.0');
    }

    public function test_language_filter(): void
    {
        $english = Book::factory()->create(['language' => 'en']);
        Book::factory()->create(['language' => 'fr']);

        $this->assertSame([$english->id], $this->catalogueIds('?language=en'));
    }

    public function test_is_free_filter(): void
    {
        $free = Book::factory()->free()->create();
        $paid = Book::factory()->create(['price' => 10]);

        $this->assertSame([$free->id], $this->catalogueIds('?is_free=1'));
        $this->assertSame([$free->id], $this->catalogueIds('?is_free=true'));
        $this->assertSame([$paid->id], $this->catalogueIds('?is_free=0'));
    }

    public function test_subscription_filter(): void
    {
        $included = Book::factory()->create(['is_subscription_available' => true]);
        Book::factory()->create(['is_subscription_available' => false]);

        $this->assertSame([$included->id], $this->catalogueIds('?subscription=1'));
    }

    public function test_has_sample_filter(): void
    {
        $withSample = Book::factory()->create(['sample_url' => 'demo/sample.pdf']);
        $emptySample = Book::factory()->create(['sample_url' => '']);

        $this->assertSame([$withSample->id], $this->catalogueIds('?has_sample=1'));
        $this->assertSame([$emptySample->id], $this->catalogueIds('?has_sample=0'));
    }

    public function test_price_range_filter(): void
    {
        Book::factory()->create(['price' => 2]);
        $inRange = Book::factory()->create(['price' => 12]);
        Book::factory()->create(['price' => 40]);

        $this->assertSame([$inRange->id], $this->catalogueIds('?price_min=5&price_max=20'));
    }

    public function test_price_max_below_price_min_is_rejected(): void
    {
        $this->getJson('/api/v1/books?price_min=20&price_max=5')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('price_max');
    }

    public function test_per_page_defaults_to_24_and_is_capped_at_60(): void
    {
        Book::factory()->count(3)->create();

        $this->getJson('/api/v1/books')->assertOk()->assertJsonPath('meta.per_page', 24);
        $this->getJson('/api/v1/books?per_page=2')->assertOk()->assertJsonPath('meta.per_page', 2)->assertJsonCount(2, 'data');
        $this->getJson('/api/v1/books?per_page=61')->assertUnprocessable()->assertJsonValidationErrors('per_page');
    }

    public function test_unknown_sort_is_rejected(): void
    {
        $this->getJson('/api/v1/books?sort=random')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('sort');
    }

    public function test_existing_filters_still_work_alongside_new_ones(): void
    {
        $match = Book::factory()->create([
            'title' => 'Prière du matin',
            'editorial_pole' => 'ecclesial',
            'work_type' => 'prayer',
            'categories' => ['Vie chrétienne'],
            'price' => 0,
        ]);
        Book::factory()->create(['title' => 'Prière du soir', 'editorial_pole' => 'ecclesial', 'work_type' => 'prayer', 'price' => 9]);

        $this->assertSame(
            [$match->id],
            $this->catalogueIds('?search=Prière&editorial_pole=ecclesial&work_type=prayer&category=Vie%20chrétienne&is_free=1'),
        );
    }

    public function test_category_counts_match_the_public_catalogue_filter(): void
    {
        Category::query()->create(['name' => 'Contes de test', 'slug' => 'contes-de-test', 'is_active' => true]);
        Category::query()->create(['name' => 'Fables de test', 'slug' => 'fables-de-test', 'is_active' => true]);
        Book::factory()->count(2)->create(['categories' => ['Contes de test']]);
        Book::factory()->draft()->create(['categories' => ['Contes de test']]);
        Book::factory()->create(['categories' => ['Contes de test'], 'copyright_status' => 'review']);

        $counts = collect($this->getJson('/api/v1/categories')->assertOk()->json('data'))->pluck('books_count', 'name');

        $this->assertSame(2, $counts['Contes de test']);
        $this->assertSame(0, $counts['Fables de test']);
        $this->assertCount(2, $this->catalogueIds('?category=Contes%20de%20test'));
    }

    /**
     * @return list<string>
     */
    private function catalogueIds(string $query = ''): array
    {
        return $this->getJson('/api/v1/books'.$query)
            ->assertOk()
            ->json('data.*.id');
    }
}
