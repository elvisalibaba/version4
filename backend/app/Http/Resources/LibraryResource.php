<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LibraryResource extends JsonResource
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
            'access_type' => $this->access_type,
            'status' => $this->status,
            'purchased_at' => $this->purchased_at,
            'expires_at' => $this->expires_at,
            'last_opened_at' => $this->last_opened_at,
            'book' => new BookResource($this->whenLoaded('book')),
            'subscription' => new SubscriptionResource($this->whenLoaded('subscription')),
        ];
    }
}
