<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\BookResource;
use App\Models\AuthorProfile;
use App\Models\Book;
use App\Models\OrderItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;

class AuthorWorkspaceController extends Controller
{
    private function profile(Request $request): AuthorProfile
    {
        abort_unless($request->user()->profile?->role === 'author', 403);

        return AuthorProfile::query()->findOrFail($request->user()->id);
    }

    public function dashboard(Request $request): JsonResponse
    {
        $author = $this->profile($request);
        $books = Book::query()->where('author_id', $author->id);

        $paidItems = OrderItem::query()
            ->whereHas('order', fn ($query) => $query->where('payment_status', 'paid'))
            ->whereHas('book', fn ($query) => $query->where('author_id', $author->id));

        $grossRevenue = (float) (clone $paidItems)
            ->get(['price', 'quantity'])
            ->sum(fn (OrderItem $item) => (float) $item->price * max(1, (int) $item->quantity));

        return response()->json([
            'data' => [
                'profile' => $author,
                'stats' => [
                    'books' => (clone $books)->count(),
                    'published_books' => (clone $books)->where('status', 'published')->count(),
                    'views' => (int) (clone $books)->sum('views_count'),
                    'clicks' => (int) (clone $books)->sum('clicks_count'),
                    'purchases' => (int) (clone $books)->sum('purchases_count'),
                    'revenue' => $grossRevenue,
                ],
                'recent_books' => BookResource::collection(
                    (clone $books)->with(['author', 'formats'])->latest()->limit(6)->get(),
                )->resolve(),
            ],
        ]);
    }

    public function books(Request $request): JsonResponse
    {
        $author = $this->profile($request);

        return response()->json([
            'data' => BookResource::collection(
                Book::query()
                    ->where('author_id', $author->id)
                    ->with(['author', 'formats', 'subscriptionPlans'])
                    ->latest()
                    ->get(),
            )->resolve(),
        ]);
    }

    public function profileShow(Request $request): JsonResponse
    {
        $author = $this->profile($request);
        $payload = $author->toArray();

        if (filled($author->avatar_url) && ! str_starts_with($author->avatar_url, 'http://') && ! str_starts_with($author->avatar_url, 'https://')) {
            $payload['avatar_url'] = Storage::disk('public')->url($author->avatar_url);
        }

        return response()->json(['data' => $payload]);
    }

    public function profileUpdate(Request $request): JsonResponse
    {
        $author = $this->profile($request);

        $data = $request->validate([
            'display_name' => ['required', 'string', 'max:120'],
            'professional_headline' => ['nullable', 'string', 'max:255'],
            'bio' => ['nullable', 'string'],
            'website' => ['nullable', 'url', 'max:2048'],
            'location' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'genres' => ['nullable', 'array', 'max:12'],
            'genres.*' => ['string', 'max:80'],
            'publishing_goals' => ['nullable', 'string'],
            'favorite_book' => ['nullable', 'string', 'max:255'],
            'favorite_author' => ['nullable', 'string', 'max:255'],
            'favorite_character' => ['nullable', 'string', 'max:255'],
            'press_mentions' => ['nullable', 'array'],
            'social_links' => ['nullable', 'array'],
            'avatar' => ['nullable', 'image', 'max:5120'],
        ]);

        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store("author-avatars/{$author->id}", 'public');
            $data['avatar_url'] = $path;
        }

        unset($data['avatar']);
        $author->update(Arr::only($data, $author->getFillable()));

        $fresh = $author->fresh();
        $payload = $fresh->toArray();

        if (filled($fresh->avatar_url) && ! str_starts_with($fresh->avatar_url, 'http://') && ! str_starts_with($fresh->avatar_url, 'https://')) {
            $payload['avatar_url'] = Storage::disk('public')->url($fresh->avatar_url);
        }

        return response()->json(['data' => $payload]);
    }

    public function sales(Request $request): JsonResponse
    {
        $author = $this->profile($request);

        $items = OrderItem::query()
            ->whereHas('book', fn ($query) => $query->where('author_id', $author->id))
            ->with(['order', 'book:id,title', 'format:id,format'])
            ->latest()
            ->paginate(50);

        $items->through(fn (OrderItem $item) => [
            'id' => $item->id,
            'order_id' => $item->order_id,
            'book_id' => $item->book_id,
            'title' => $item->book?->title ?? $item->title ?? 'Livre',
            'book_format' => $item->book_format,
            'price' => (float) $item->price,
            'quantity' => max(1, (int) $item->quantity),
            'currency_code' => $item->currency_code,
            'payment_status' => $item->order?->payment_status,
            'payment_provider' => $item->order?->payment_provider,
            'payment_channel' => $item->order?->payment_channel,
            'created_at' => $item->created_at?->toIso8601String(),
        ]);

        return response()->json($items);
    }
}
