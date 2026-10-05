<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\BookResource;
use App\Models\AuthorProfile;
use App\Models\Book;
use App\Models\OrderItem;
use App\Models\MediaEdition;
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
                    'audiobooks' => MediaEdition::query()->where('media_type', 'audiobook')->whereIn('book_id', (clone $books)->select('id'))->count(),
                    'videos' => MediaEdition::query()->where('media_type', 'video')->whereIn('book_id', (clone $books)->select('id'))->count(),
                ],
                'recent_books' => BookResource::collection(
                    (clone $books)->with(['author', 'formats', 'mediaEditions'])->latest()->limit(6)->get(),
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
                    ->with(['author', 'formats', 'mediaEditions', 'subscriptionPlans'])
                    ->latest()
                    ->get(),
            )->resolve(),
        ]);
    }

    public function book(Request $request, Book $book): JsonResponse
    {
        $author = $this->profile($request);
        abort_unless($book->author_id === $author->id, 404);

        $book->load([
            'author',
            'formats',
            'mediaEditions',
            'subscriptionPlans',
            'manuscriptVersions.creator:id,name,email',
        ]);

        $payload = (new BookResource($book))->resolve($request);

        $payload['author_workspace'] = [
            'writing_status' => $book->writing_status,
            'target_word_count' => $book->target_word_count,
            'current_word_count' => $book->current_word_count,
            'next_author_action' => $book->next_author_action,
            'editorial_deadline' => $book->editorial_deadline?->toDateString(),
            'author_private_notes' => $book->author_private_notes,
            'editorial_stage' => $book->editorial_stage,
            'bat_status' => $book->bat_status,
            'manuscript_versions' => $book->manuscriptVersions
                ->take(20)
                ->map(fn ($version): array => [
                    'id' => $version->id,
                    'version_number' => $version->version_number,
                    'file_format' => $version->file_format,
                    'file_size' => $version->file_size,
                    'status' => $version->status,
                    'change_summary' => $version->change_summary,
                    'created_at' => $version->created_at?->toIso8601String(),
                ])
                ->values(),
        ];

        $payload['reader_rights'] = [
            'reading_access_mode' => $book->reading_access_mode,
            'can_read_on_platform' => (bool) $book->can_read_on_platform,
            'allow_download' => false,
            'allow_print' => (bool) $book->allow_print,
            'allow_copy' => (bool) $book->allow_copy,
            'reader_watermark_enabled' => (bool) $book->reader_watermark_enabled,
            'rights_agreement_reference' => $book->rights_agreement_reference,
            'reader_rights_note' => $book->reader_rights_note,
        ];

        return response()->json(['data' => $payload]);
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
            'created_at' => $item->order?->created_at?->toIso8601String(),
        ]);

        return response()->json($items);
    }
}
