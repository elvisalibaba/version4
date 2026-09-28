<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class AuthorResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $avatarUrl = $this->avatar_url;
        if (is_string($avatarUrl) && $avatarUrl !== '' && ! str_starts_with($avatarUrl, 'http://') && ! str_starts_with($avatarUrl, 'https://')) {
            $avatarUrl = Storage::disk('public')->url($avatarUrl);
        }

        return [
            'id' => $this->id,
            'display_name' => $this->display_name,
            'avatar_url' => $avatarUrl,
            'bio' => $this->bio,
            'website' => $this->website,
            'location' => $this->location,
            'social_links' => $this->social_links,
            'professional_headline' => $this->professional_headline,
            'genres' => $this->genres,
            'publishing_goals' => $this->publishing_goals,
            'favorite_book' => $this->favorite_book,
            'favorite_author' => $this->favorite_author,
            'favorite_character' => $this->favorite_character,
            'press_mentions' => $this->press_mentions,
            'published_books_count' => $this->whenHas('published_books_count'),
            'books' => BookResource::collection($this->whenLoaded('books')),
        ];
    }
}
