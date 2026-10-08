<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PublicBookResource;
use App\Models\Book;
use App\Models\Favorite;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class FavoriteController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $books = Book::query()
            ->publiclyAvailable()
            ->whereIn('id', Favorite::query()->where('user_id', $request->user()->id)->select('book_id'))
            ->with(['author', 'formats'])
            ->latest()
            ->paginate(24);

        return PublicBookResource::collection($books);
    }

    public function store(Request $request, Book $book): JsonResponse
    {
        abort_unless($book->status === 'published' && $book->copyright_status !== 'blocked', 404);

        Favorite::query()->firstOrCreate(['user_id' => $request->user()->id, 'book_id' => $book->id]);

        return response()->json(['message' => 'Livre ajouté aux favoris.'], 201);
    }

    public function destroy(Request $request, Book $book): Response
    {
        Favorite::query()->where('user_id', $request->user()->id)->where('book_id', $book->id)->delete();

        return response()->noContent();
    }
}
