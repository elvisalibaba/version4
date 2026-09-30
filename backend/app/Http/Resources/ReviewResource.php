<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $profile = $this->whenLoaded('profile');

        return [
            'id' => $this->id,
            'rating' => (float) $this->rating,
            'text' => $this->review_text,
            'helpful_count' => (int) $this->helpful_count,
            'verified_purchase' => (bool) $this->getAttribute('verified_purchase'),
            'is_mine' => (bool) $this->getAttribute('is_mine'),
            'author' => [
                'id' => $this->user_id,
                'name' => $profile?->name
                    ?: trim(($profile?->first_name ?? '').' '.($profile?->last_name ?? ''))
                    ?: 'Lecteur Holistique',
            ],
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
