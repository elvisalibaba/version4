<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $profile = $this->relationLoaded('profile') ? $this->profile : null;

        return [
            'id' => $this->id,
            'rating' => (float) $this->rating,
            'text' => $this->review_text,
            'helpful_count' => (int) $this->helpful_count,
            'verified_purchase' => (bool) $this->getAttribute('verified_purchase'),
            'is_mine' => (bool) $this->getAttribute('is_mine'),
            'author' => [
                'name' => $this->displayName($profile),
            ],
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    private function displayName(mixed $profile): string
    {
        $first = trim((string) ($profile?->first_name ?? ''));
        $last = trim((string) ($profile?->last_name ?? ''));

        if ($first === '' && $last === '') {
            $parts = preg_split('/\s+/', trim((string) ($profile?->name ?? '')), -1, PREG_SPLIT_NO_EMPTY) ?: [];
            $first = $parts[0] ?? '';
            $last = count($parts) > 1 ? (string) end($parts) : '';
        }

        if ($first === '') {
            return 'Lecteur Holistique';
        }

        return $last === ''
            ? $first
            : $first.' '.mb_strtoupper(mb_substr($last, 0, 1)).'.';
    }
}
