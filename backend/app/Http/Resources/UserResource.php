<?php

namespace App\Http\Resources;

use App\Support\PublicMediaUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
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
            'email' => $this->email,
            'name' => $this->name,
            'email_verified_at' => $this->email_verified_at,
            'profile' => $this->whenLoaded('profile', fn (): array => [
                'role' => $this->profile->role,
                'avatar_url' => PublicMediaUrl::resolve($this->profile->avatar_url),
                'first_name' => $this->profile->first_name,
                'last_name' => $this->profile->last_name,
                'phone' => $this->profile->phone,
                'country' => $this->profile->country,
                'city' => $this->profile->city,
                'preferred_language' => $this->profile->preferred_language,
                'favorite_categories' => $this->profile->favorite_categories,
                'marketing_opt_in' => $this->profile->marketing_opt_in,
                'author_profile' => $this->profile->relationLoaded('authorProfile') ? $this->profile->authorProfile : null,
            ]),
        ];
    }
}
