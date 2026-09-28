<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'total_price' => $this->total_price,
            'currency_code' => $this->currency_code,
            'payment_status' => $this->payment_status,
            'payment_provider' => $this->payment_provider,
            'payment_channel' => $this->payment_channel,
            'payment_verified_at' => $this->payment_verified_at,
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($item): array => [
                'id' => $item->id,
                'book_id' => $item->book_id,
                'title' => $item->book?->title,
                'format_id' => $item->format_id,
                'book_format' => $item->book_format,
                'price' => $item->price,
                'currency_code' => $item->currency_code,
                'quantity' => $item->quantity,
            ])),
            'created_at' => $this->created_at,
        ];
    }
}
