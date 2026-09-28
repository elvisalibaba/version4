<?php

namespace App\Services;

use App\Models\Book;
use App\Models\BookFormat;
use App\Models\Order;
use App\Models\Profile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    /**
     * @param  array{items: array<int, array{book_id: string, format_id?: string|null, book_format: string, quantity?: int}>, currency_code?: string, payment_provider?: string|null, payment_channel?: string|null}  $data
     */
    public function createPending(Profile $profile, array $data): Order
    {
        return DB::transaction(function () use ($profile, $data): Order {
            $currencyCode = mb_strtoupper(Arr::get($data, 'currency_code', 'USD'));
            $resolvedItems = collect($data['items'])->map(function (array $item) use ($currencyCode): array {
                $book = Book::query()->where('status', 'published')->findOrFail($item['book_id']);
                $format = isset($item['format_id']) ? BookFormat::query()->whereBelongsTo($book)->find($item['format_id']) : null;

                if ($format !== null && ($format->format !== $item['book_format'] || ! $format->is_published)) {
                    throw ValidationException::withMessages(['items' => 'Le format sélectionné n’est pas disponible.']);
                }

                $price = (float) ($format?->price ?? $book->price);
                $itemCurrency = $format?->currency_code ?? $book->currency_code;
                if ($itemCurrency !== $currencyCode) {
                    throw ValidationException::withMessages(['currency_code' => 'Tous les articles doivent utiliser la même devise.']);
                }

                return [
                    'book_id' => $book->id,
                    'format_id' => $format?->id,
                    'book_format' => $item['book_format'],
                    'quantity' => $item['quantity'] ?? 1,
                    'price' => $price,
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

            return $order->load(['items.book', 'items.format']);
        });
    }
}
