<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Support\PublicMediaUrl;

class AuthorResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $avatarUrl = PublicMediaUrl::resolve($this->avatar_url);

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
