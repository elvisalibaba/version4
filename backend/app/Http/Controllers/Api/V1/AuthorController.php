<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\AuthorResource;
use App\Models\AuthorProfile;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AuthorController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return AuthorResource::collection(
            AuthorProfile::query()
                ->where(function ($query): void {
                    $query->where('is_reference_profile', false)
                        ->orWhereHas('books', fn ($books) => $books->publiclyAvailable()->where('status', 'published'));
                })
                ->withCount(['books as published_books_count' => fn ($query) => $query->publiclyAvailable()->where('status', 'published')])
                ->with(['books' => fn ($query) => $query->publiclyAvailable()->with('formats')->latest('published_at')])
                ->orderBy('display_name')
                ->paginate(24),
        );
    }

    public function show(AuthorProfile $author): AuthorResource
    {
        if ($author->is_reference_profile && ! $author->books()->publiclyAvailable()->where('status', 'published')->exists()) {
            abort(404);
        }

        return new AuthorResource($author->loadCount(['books as published_books_count' => fn ($query) => $query->publiclyAvailable()->where('status', 'published')])
            ->load(['books' => fn ($query) => $query->publiclyAvailable()->with('formats')->latest('published_at')]));
    }
}
