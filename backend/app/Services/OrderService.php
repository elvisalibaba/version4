<?php

namespace App\Services;

use App\Models\Book;
use App\Models\BookFormat;
use App\Models\Order;
use App\Models\Profile;
use App\Models\PromotionEvent;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function __construct(
        private PromotionPricingService $promotions,
        private MarketPricingService $marketPricing,
    ) {}

    /**
     * @param  array{items: array<int, array{book_id: string, format_id?: string|null, book_format: string, quantity?: int}>, currency_code?: string, payment_provider?: string|null, payment_channel?: string|null}  $data
     */
    public function createPending(Profile $profile, array $data): Order
    {
        return DB::transaction(function () use ($profile, $data): Order {
            $currencyCode = mb_strtoupper(Arr::get($data, 'currency_code', 'USD'));
            $profileCountry = is_string($profile->country) && mb_strlen(trim($profile->country)) === 2
                ? mb_strtoupper(trim($profile->country))
                : null;
            $marketCountryCode = mb_strtoupper((string) Arr::get($data, 'market_country_code', $profileCountry ?? ''));

            $resolvedItems = collect($data['items'])->map(function (array $item) use ($currencyCode, $marketCountryCode): array {
                $book = Book::query()
                    ->where('status', 'published')
                    ->where('copyright_status', 'clear')
                    ->findOrFail($item['book_id']);

                $formatQuery = BookFormat::query()
                    ->whereBelongsTo($book)
                    ->where('is_published', true);

                $format = isset($item['format_id'])
                    ? (clone $formatQuery)->whereKey($item['format_id'])->first()
                    : (clone $formatQuery)->where('format', $item['book_format'])->first();

                if (isset($item['format_id']) && $format === null) {
                    throw ValidationException::withMessages(['items' => 'Le format sélectionné n’est pas disponible.']);
                }

                if ($format !== null && $format->format !== $item['book_format']) {
                    throw ValidationException::withMessages(['items' => 'Le format sélectionné ne correspond pas à la commande.']);
                }

                if ($format === null && in_array($item['book_format'], ['paperback', 'pocket', 'hardcover', 'audiobook'], true)) {
                    throw ValidationException::withMessages(['items' => 'Ce format physique ou média n’est pas publié pour ce livre.']);
                }

                $basePrice = (float) ($format?->price ?? $book->price);
                $itemCurrency = mb_strtoupper((string) ($format?->currency_code ?? $book->currency_code));

                $marketPricing = $this->marketPricing->resolve(
                    $book,
                    $basePrice,
                    $currencyCode,
                    $marketCountryCode !== '' ? $marketCountryCode : null,
                );

                if ($marketPricing['market_price'] === null && $itemCurrency !== $currencyCode) {
                    throw ValidationException::withMessages([
                        'currency_code' => 'Aucun prix actif n’est défini pour cette devise et ce marché.',
                    ]);
                }

                $pricing = $this->promotions->bestFor($book, $marketPricing['price'], $currencyCode);

                return [
                    'book_id' => $book->id,
                    'format_id' => $format?->id,
                    'book_format' => $item['book_format'],
                    'quantity' => $item['quantity'] ?? 1,
                    'original_price' => $pricing['original_price'],
                    'promotion_campaign_id' => $pricing['promotion']?->id,
                    'price' => $pricing['price'],
                    'currency_code' => $currencyCode,
                ];
            });

            $order = Order::query()->create([
                'user_id' => $profile->id,
                'total_price' => $resolvedItems->sum(fn (array $item): float => $item['price'] * $item['quantity']),
                'payment_status' => 'pending',
                'currency_code' => $currencyCode,
                'payment_provider' => Arr::get($data, 'payment_provider'),
                'payment_channel' => Arr::get($data, 'payment_channel'),
                'payment_metadata' => [],
            ]);

            $order->items()->createMany($resolvedItems->all());

            foreach ($order->items()->whereNotNull('promotion_campaign_id')->get() as $item) {
                PromotionEvent::query()->create([
                    'promotion_campaign_id' => $item->promotion_campaign_id,
                    'book_id' => $item->book_id,
                    'user_id' => $profile->id,
                    'order_id' => $order->id,
                    'event_type' => 'checkout',
                    'channel' => 'checkout',
                    'revenue_amount' => $item->price * $item->quantity,
                    'currency_code' => $item->currency_code,
                    'occurred_at' => now(),
                ]);
            }

            return $order->load(['items.book', 'items.format']);
        });
    }
}
